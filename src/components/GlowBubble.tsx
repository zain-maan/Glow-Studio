import { useEffect, useRef, useState } from 'react'
import { prefersReducedMotion } from '../lib/motion'

// Compact 3D simplex noise (Ashima Arts / Stefan Gustavson, MIT) used to make the surface flow.
const NOISE = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.0-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;vec4 s1=floor(b1)*2.0+1.0;vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}`

function webglAvailable() {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

// A slowly morphing, iridescent "glow" bubble lit in the brand's peach, rose and orchid.
// It leans towards the pointer and swells as you scroll past it.
export default function GlowBubble({ className = '' }: { className?: string }) {
  const host = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (prefersReducedMotion() || !webglAvailable()) return
    let disposed = false
    let cleanup = () => {}

    import('../lib/three').then((T) => {
      if (disposed || !host.current) return
      const el = host.current
      const mobile = window.matchMedia('(pointer: coarse)').matches
      const renderer = new T.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.25 : 2))
      renderer.setClearColor(0x000000, 0)
      el.appendChild(renderer.domElement)
      renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%'

      const scene = new T.Scene()
      const camera = new T.PerspectiveCamera(35, 1, 0.1, 50)
      camera.position.set(0, 0, 6)

      // Soft studio reflections give the iridescence something to shimmer with.
      const pmrem = new T.PMREMGenerator(renderer)
      const env = pmrem.fromScene(new T.RoomEnvironment(), 0.04).texture
      scene.environment = env

      const uniforms = { uTime: { value: 0 }, uAmp: { value: 0.22 } }
      const material = new T.MeshPhysicalMaterial({
        color: new T.Color('#ffd6e2'),
        roughness: 0.12,
        metalness: 0.05,
        clearcoat: 1,
        clearcoatRoughness: 0.08,
        iridescence: 1,
        iridescenceIOR: 1.35,
        iridescenceThicknessRange: [180, 820],
        sheen: 1,
        sheenColor: new T.Color('#ff9ec4'),
        envMapIntensity: 1.2,
      })
      // Push each vertex in and out along its normal with flowing noise.
      material.onBeforeCompile = (shader) => {
        shader.uniforms.uTime = uniforms.uTime
        shader.uniforms.uAmp = uniforms.uAmp
        shader.vertexShader = shader.vertexShader
          .replace('#include <common>', `#include <common>\nuniform float uTime;\nuniform float uAmp;\n${NOISE}`)
          .replace(
            '#include <begin_vertex>',
            `#include <begin_vertex>
             float n = snoise(position * 1.25 + vec3(uTime * 0.28));
             float n2 = snoise(position * 2.6 - vec3(uTime * 0.18)) * 0.35;
             transformed += normal * (n + n2) * uAmp;`,
          )
      }
      const mesh = new T.Mesh(new T.IcosahedronGeometry(1.25, mobile ? 40 : 80), material)
      scene.add(mesh)

      const lights = [
        { colour: '#ffb199', pos: [3, 2, 3] },
        { colour: '#ff6f91', pos: [-3, -1.5, 2.5] },
        { colour: '#c86dd7', pos: [0.5, -3, 2] },
      ].map(({ colour, pos }) => {
        const l = new T.PointLight(colour, 18, 14)
        l.position.set(pos[0], pos[1], pos[2])
        scene.add(l)
        return l
      })

      const resize = () => {
        const { width, height } = el.getBoundingClientRect()
        if (!width || !height) return
        renderer.setSize(width, height, false)
        camera.aspect = width / height
        camera.updateProjectionMatrix()
      }
      resize()
      const ro = new ResizeObserver(resize)
      ro.observe(el)

      const pointer = new T.Vector2()
      const onMove = (e: PointerEvent) => pointer.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1)
      window.addEventListener('pointermove', onMove, { passive: true })

      let visible = true
      const io = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting
        if (visible && !raf) raf = requestAnimationFrame(frame)
      })
      io.observe(el)

      const clock = new T.Clock()
      let raf = 0
      let first = true
      const frame = () => {
        raf = 0
        if (!visible || disposed) return
        const t = clock.getElapsedTime()
        uniforms.uTime.value = t
        // Lean towards the pointer, drift gently on its own.
        mesh.rotation.y += (pointer.x * 0.6 + t * 0.15 - mesh.rotation.y) * 0.04
        mesh.rotation.x += (-pointer.y * 0.4 - mesh.rotation.x) * 0.04
        mesh.position.y = Math.sin(t * 0.8) * 0.08
        lights.forEach((l, i) => {
          l.position.x = Math.cos(t * 0.35 + i * 2.1) * 3.2
          l.position.y = Math.sin(t * 0.45 + i * 2.1) * 2.4
        })
        renderer.render(scene, camera)
        if (first) {
          first = false
          setReady(true)
        }
        raf = requestAnimationFrame(frame)
      }
      raf = requestAnimationFrame(frame)

      cleanup = () => {
        cancelAnimationFrame(raf)
        io.disconnect()
        ro.disconnect()
        window.removeEventListener('pointermove', onMove)
        mesh.geometry.dispose()
        material.dispose()
        env.dispose()
        pmrem.dispose()
        renderer.dispose()
        renderer.domElement.remove()
      }
    })

    return () => {
      disposed = true
      cleanup()
    }
  }, [])

  return <div ref={host} aria-hidden="true" className={`pointer-events-none transition-opacity duration-[1.5s] ${ready ? 'opacity-100' : 'opacity-0'} ${className}`} />
}
