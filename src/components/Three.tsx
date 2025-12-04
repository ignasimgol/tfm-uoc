import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function ThreeBackground() {
  const mountRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setClearColor(0x000000, 0)
    mount.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
    camera.position.z = 5

    const count = 110
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      // random sphere shell
      const r = 2.5 + Math.random() * 1.5
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      positions[i3] = r * Math.sin(phi) * Math.cos(theta)
      positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      positions[i3 + 2] = r * Math.cos(phi)
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const material = new THREE.PointsMaterial({
      color: 0x2e7915,
      size: 0.02,
      transparent: true,
      opacity: 0.9,
    })
    const points = new THREE.Points(geometry, material)
    scene.add(points)

    const gradGeom = new THREE.PlaneGeometry(20, 10)
    const gradMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      opacity: 0.02,
      transparent: true,
    })
    const gradMesh = new THREE.Mesh(gradGeom, gradMat)
    gradMesh.position.z = -5
    scene.add(gradMesh)

    const clock = new THREE.Clock()
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const speed = reduceMotion ? 0.02 : 0.1

    const mouse = new THREE.Vector2(0, 0)
    const onMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1
      const y = (e.clientY / window.innerHeight) * 2 - 1
      mouse.set(x, y)
    }
    const onMouseLeave = () => {
      mouse.set(0, 0)
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseout', onMouseLeave)

    let rafId = 0
    const animate = () => {
      const t = clock.getElapsedTime()
      
      points.rotation.y = t * speed + (reduceMotion ? 0 : mouse.x * 0.05)
      points.rotation.x = Math.sin(t * speed * 2) * 0.05 + (reduceMotion ? 0 : -mouse.y * 0.05)

      points.position.x = THREE.MathUtils.lerp(points.position.x, (reduceMotion ? 0 : mouse.x) * 0.6, 0.08)
      points.position.y = THREE.MathUtils.lerp(points.position.y, (reduceMotion ? 0 : -mouse.y) * 0.4, 0.08)
      gradMesh.position.x = THREE.MathUtils.lerp(gradMesh.position.x, (reduceMotion ? 0 : mouse.x) * 0.8, 0.03)
      gradMesh.position.y = THREE.MathUtils.lerp(gradMesh.position.y, (reduceMotion ? 0 : -mouse.y) * 0.6, 0.03)

      camera.position.x = THREE.MathUtils.lerp(camera.position.x, (reduceMotion ? 0 : mouse.x) * 0.5, 0.05)
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, (reduceMotion ? 0 : -mouse.y) * 0.3, 0.05)
      camera.lookAt(0, 0, 0)
      gradMesh.rotation.z = Math.sin(t * speed) * 0.02
      renderer.render(scene, camera)
      rafId = requestAnimationFrame(animate)
    }
    animate()

    const onResize = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseout', onMouseLeave)
      geometry.dispose()
      material.dispose()
      gradGeom.dispose()
      gradMat.dispose()
      renderer.dispose()
      mount.removeChild(renderer.domElement)
    }
  }, [])

  return <div ref={mountRef} className="fixed inset-0 z-0" />
}