"use client";

import { useEffect, useRef, useState } from "react";

type Variant = "aura" | "pixels";

const VERT = `
attribute vec2 a_pos;
void main() {
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

/**
 * aura — chromatic concentric rings on a white base. mixes toward
 * orange / pink / blue, follows the pointer, adds grain, then
 * posterizes the color steps.
 */
const AURA_FRAG = `
precision highp float;
uniform vec2 u_res;
uniform float u_time;
uniform vec2 u_mouse;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_res) / min(u_res.x, u_res.y);
  vec2 center = u_mouse * 0.3;
  float d = length(uv - center);

  vec3 base = vec3(1.0);
  vec3 orange = vec3(1.0, 0.3, 0.1);
  vec3 pink = vec3(1.0, 0.1, 0.6);
  vec3 blue = vec3(0.2, 0.6, 1.0);

  float ringA = smoothstep(0.4, 0.6, sin(d * 12.0 - u_time * 0.9) * 0.5 + 0.5);
  float ringB = smoothstep(0.35, 0.65, sin(d * 8.0 - u_time * 0.6 + 2.1) * 0.5 + 0.5);
  float ringC = smoothstep(0.3, 0.7, sin(d * 16.0 - u_time * 1.2 + 4.2) * 0.5 + 0.5);
  float falloff = 1.0 - smoothstep(0.0, 1.1, d);

  vec3 color = base;
  color = mix(color, orange, ringA * falloff * 0.85);
  color = mix(color, pink, ringB * falloff * 0.55);
  color = mix(color, blue, ringC * falloff * 0.65);

  float grain = hash(gl_FragCoord.xy + fract(u_time) * 61.0);
  color += (grain - 0.5) * 0.06;

  color = floor(color * 40.0) / 40.0;
  gl_FragColor = vec4(color, 1.0);
}
`;

/**
 * pixels — an 18x18 pixelated gradient grid pulsing between orange
 * and purple, with a time-based row mask sweeping through.
 */
const PIXELS_FRAG = `
precision highp float;
uniform vec2 u_res;
uniform float u_time;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  vec2 cell = floor(uv * 18.0) / 18.0;

  vec3 orange = vec3(1.0, 0.3, 0.0);
  vec3 purple = vec3(0.5, 0.0, 1.0);

  float jitter = hash(cell) * 6.2831;
  float pulse = sin(u_time * 1.4 + cell.x * 5.0 + cell.y * 7.0 + jitter) * 0.5 + 0.5;
  vec3 color = mix(orange, purple, pulse);

  float row = floor(uv.y * 18.0);
  float mask = step(0.3, fract(row / 18.0 + u_time * 0.08));
  color *= 0.3 + 0.7 * mask;

  gl_FragColor = vec4(color, 1.0);
}
`;

function compile(
  gl: WebGLRenderingContext,
  type: number,
  source: string
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export function ShaderCanvas({
  variant,
  className = "",
}: {
  variant: Variant;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let gl: WebGLRenderingContext | null = null;
    try {
      gl = canvas.getContext("webgl", {
        antialias: false,
        depth: false,
        stencil: false,
      }) as WebGLRenderingContext | null;
    } catch {
      gl = null;
    }
    if (!gl) {
      setFailed(true);
      return;
    }

    const vert = compile(gl, gl.VERTEX_SHADER, VERT);
    const frag = compile(
      gl,
      gl.FRAGMENT_SHADER,
      variant === "aura" ? AURA_FRAG : PIXELS_FRAG
    );
    const program = gl.createProgram();
    if (!vert || !frag || !program) {
      setFailed(true);
      return;
    }
    gl.attachShader(program, vert);
    gl.attachShader(program, frag);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      setFailed(true);
      return;
    }
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW
    );
    const aPos = gl.getAttribLocation(program, "a_pos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(program, "u_res");
    const uTime = gl.getUniformLocation(program, "u_time");
    const uMouse = gl.getUniformLocation(program, "u_mouse");

    let raf = 0;
    const start = performance.now();
    // pointer target + eased position, in shader space (-1..1)
    let targetX = 0;
    let targetY = 0;
    let mouseX = 0;
    let mouseY = 0;

    function resize() {
      if (!gl || !canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.floor(canvas.clientWidth * dpr));
      const h = Math.max(1, Math.floor(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    }

    function onPointerMove(e: PointerEvent) {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      targetX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      targetY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    }

    function frame(now: number) {
      if (!gl) return;
      resize();
      mouseX += (targetX - mouseX) * 0.06;
      mouseY += (targetY - mouseY) * 0.06;
      gl.uniform2f(uRes, canvas!.width, canvas!.height);
      gl.uniform1f(uTime, (now - start) / 1000);
      if (uMouse) gl.uniform2f(uMouse, mouseX, mouseY);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      raf = requestAnimationFrame(frame);
    }

    window.addEventListener("pointermove", onPointerMove);
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onPointerMove);
      if (gl) {
        gl.deleteBuffer(buffer);
        gl.deleteProgram(program);
        gl.deleteShader(vert);
        gl.deleteShader(frag);
        const lose = gl.getExtension("WEBGL_lose_context");
        lose?.loseContext();
      }
    };
  }, [variant]);

  if (failed) {
    return (
      <div
        className={`shader-fallback shader-fallback-${variant} ${className}`}
        aria-hidden="true"
      />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className={`shader-canvas ${className}`}
      aria-hidden="true"
    />
  );
}
