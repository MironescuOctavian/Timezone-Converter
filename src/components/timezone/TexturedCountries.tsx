import { createEffect, createSignal, onSettled, Show } from "solid-js";
import type { GeoProjection } from "d3-geo";
import { CanvasCountries } from "./CanvasCountries";
import { bakeGlobeTextures, cameraMatrix, globeViewport } from "./globe-texture";
import { countryCities } from "./data";
import { countries } from "./geography";

type Props = {
  projection: GeoProjection;
  zoom: number;
  aspectRatio: number;
  dragging: boolean;
  hover: number;
  active: (index: number | undefined) => boolean;
  onReady: () => void;
};
const vertexSource = `attribute vec2 position;
varying vec2 point;
void main(){point=position;gl_Position=vec4(position,0.,1.);}`;
// Analytic orthographic sphere: reconstruct a surface normal per pixel, rotate
// to longitude/latitude, then sample reusable textures. No CPU mesh projection.
const fragmentSource = `precision highp float;
varying vec2 point;
uniform mat3 rotation;
uniform sampler2D ids;
uniform sampler2D borders;
uniform sampler2D palette;
uniform vec4 borderColor;
uniform vec4 outlineColor;
uniform float selected;
uniform vec2 viewScale;
void main(){
  vec2 p=point*(260./245.)*viewScale;
  float r=dot(p,p);if(r>1.)discard;
  vec3 world=rotation*vec3(sqrt(max(0.,1.-r)),p.x,p.y);
  vec2 uv=vec2(atan(world.y,world.x)/6.28318530718+.5,.5-asin(clamp(world.z,-1.,1.))/3.14159265359);
  vec4 id=texture2D(ids,uv);float index=floor(id.r*255.+.5);
  if(index<.5||id.a<.5)discard;
  vec4 color=texture2D(palette,vec2((index+.5)/256.,.5));
  float edge=texture2D(borders,uv).a;
  vec4 ink=abs(index-selected)<.5?outlineColor:borderColor;
  gl_FragColor=mix(color,ink,edge*.85);
}`;

export function TexturedCountries(props: Props) {
  let canvas: HTMLCanvasElement | undefined;
  let gl: WebGLRenderingContext | null = null;
  let program: WebGLProgram | undefined;
  const textures: WebGLTexture[] = [];
  const [failed, setFailed] = createSignal(false);
  const [revision, setRevision] = createSignal(0);
  let paletteKey = "";
  const colorContext =
    typeof document === "undefined"
      ? null
      : document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  function color(name: string) {
    const probe = document.createElement("span");
    probe.style.cssText = `display:none;color:var(${name})`;
    canvas!.appendChild(probe);
    const value = getComputedStyle(probe).color;
    probe.remove();
    colorContext!.fillStyle = value;
    colorContext!.fillRect(0, 0, 1, 1);
    return [...colorContext!.getImageData(0, 0, 1, 1).data];
  }
  onSettled(() => {
    if (!canvas) return;
    const shaders: WebGLShader[] = [];
    let buffer: WebGLBuffer | null = null;
    const lost = (event: Event) => {
      event.preventDefault();
      setFailed(true);
    };
    const refresh = () => setRevision((value) => value + 1);
    const observer = new MutationObserver(refresh);
    const scheme = matchMedia("(prefers-color-scheme: light)");
    try {
      gl = canvas.getContext("webgl", { alpha: true, antialias: false, premultipliedAlpha: false });
      if (!gl) throw Error("WebGL unavailable");
      program = gl.createProgram()!;
      for (const [type, source] of [
        [gl.VERTEX_SHADER, vertexSource],
        [gl.FRAGMENT_SHADER, fragmentSource],
      ] as const) {
        const shader = gl.createShader(type)!;
        shaders.push(shader);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
          throw Error("Globe shader compilation failed");
        gl.attachShader(program, shader);
      }
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS))
        throw Error("Globe shader linking failed");
      gl.useProgram(program);
      buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
        gl.STATIC_DRAW,
      );
      const location = gl.getAttribLocation(program, "position");
      gl.enableVertexAttribArray(location);
      gl.vertexAttribPointer(location, 2, gl.FLOAT, false, 0, 0);
      const maps = bakeGlobeTextures(Math.min(2048, gl.getParameter(gl.MAX_TEXTURE_SIZE)));
      [maps.ids, maps.borders, null].forEach((image, index) => {
        const texture = gl!.createTexture()!;
        textures.push(texture);
        gl!.activeTexture(gl!.TEXTURE0 + index);
        gl!.bindTexture(gl!.TEXTURE_2D, texture);
        gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_S, gl!.CLAMP_TO_EDGE);
        gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_T, gl!.CLAMP_TO_EDGE);
        gl!.texParameteri(
          gl!.TEXTURE_2D,
          gl!.TEXTURE_MIN_FILTER,
          index === 1 ? gl!.LINEAR_MIPMAP_LINEAR : gl!.NEAREST,
        );
        gl!.texParameteri(
          gl!.TEXTURE_2D,
          gl!.TEXTURE_MAG_FILTER,
          index === 1 ? gl!.LINEAR : gl!.NEAREST,
        );
        if (image) {
          gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGBA, gl!.RGBA, gl!.UNSIGNED_BYTE, image);
          if (index === 1) gl!.generateMipmap(gl!.TEXTURE_2D);
        }
        gl!.uniform1i(
          gl!.getUniformLocation(program!, ["ids", "borders", "palette"][index]!),
          index,
        );
      });
      canvas.addEventListener("webglcontextlost", lost);
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["data-theme", "class", "style"],
      });
      scheme.addEventListener("change", refresh);
      refresh();
    } catch {
      setFailed(true);
    }
    return () => {
      observer.disconnect();
      scheme.removeEventListener("change", refresh);
      canvas?.removeEventListener("webglcontextlost", lost);
      textures.forEach((texture) => gl?.deleteTexture(texture));
      shaders.forEach((shader) => gl?.deleteShader(shader));
      if (buffer) gl?.deleteBuffer(buffer);
      if (program) gl?.deleteProgram(program);
    };
  });
  createEffect(
    () => ({
      revision: revision(),
      projection: props.projection,
      zoom: props.zoom,
      aspectRatio: props.aspectRatio,
      dragging: props.dragging,
      hover: props.hover,
      active: countries.map((country) =>
        props.active(countryCities[String(country.id ?? country.properties.name)]),
      ),
    }),
    (state) => {
      if (!state.revision || !gl || !program || !canvas || gl.isContextLost()) return;
      const key = `${state.revision}:${state.hover}:${state.active.join("")}`;
      gl.useProgram(program);
      if (key !== paletteKey) {
        const primary = color("--rl-primary-500"),
          muted = color("--rl-primary-700");
        const data = new Uint8Array(256 * 4);
        countries.forEach((country, index) => {
          const selected =
            countryCities[String(country.id ?? country.properties.name)] === state.hover;
          data.set(
            [
              ...(state.active[index] ? primary : muted).slice(0, 3),
              selected ? 255 : state.active[index] ? 179 : 26,
            ],
            (index + 1) * 4,
          );
        });
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, textures[2]!);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 256, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
        for (const [uniform, token] of [
          ["borderColor", "--rl-neutral-50"],
          ["outlineColor", "--site-map-selected-outline"],
        ])
          gl.uniform4fv(
            gl.getUniformLocation(program, uniform!),
            color(token!).map((value) => value / 255),
          );
        paletteKey = key;
      }
      const size = state.dragging ? 780 : 1560;
      if (canvas.width !== size) canvas.width = canvas.height = size;
      gl.viewport(0, 0, size, size);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniformMatrix3fv(
        gl.getUniformLocation(program, "rotation"),
        false,
        cameraMatrix(state.projection),
      );
      const viewport = globeViewport(state.zoom, state.aspectRatio);
      gl.uniform2f(gl.getUniformLocation(program, "viewScale"), viewport.scaleX, viewport.scaleY);
      gl.uniform1f(
        gl.getUniformLocation(program, "selected"),
        countries.findIndex(
          (country) => countryCities[String(country.id ?? country.properties.name)] === state.hover,
        ) + 1,
      );
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      props.onReady();
    },
  );
  return (
    <Show when={!failed()} fallback={<CanvasCountries {...props} />}>
      <foreignObject
        x={globeViewport(props.zoom, props.aspectRatio).x}
        y={globeViewport(props.zoom, props.aspectRatio).y}
        width={globeViewport(props.zoom, props.aspectRatio).width}
        height={globeViewport(props.zoom, props.aspectRatio).height}
        pointer-events="none"
      >
        <canvas
          ref={(element) => {
            canvas = element;
          }}
          width="1560"
          height="1560"
          class="block h-full w-full"
          aria-hidden="true"
        />
      </foreignObject>
    </Show>
  );
}
