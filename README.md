# 🌐 Example Sphere



https://github.com/user-attachments/assets/f1ab9757-5688-4980-878d-81b24b54978c

https://www.shadertoy.com/view/7fjSD1


A tiny GLSL sphere shader

It raymarches a sphere, warps the surface with animated 3D noise, and shades it using the surface normal, which gives it that shifting false-color / topology-map look.

## ✨ What It Does

- Renders a procedural sphere from `sphere.frag`
- Uses `iTime` to animate the surface distortion
- Visualizes normals directly for a bold neon look
- Runs through `vsdf`'s ShaderToy-style wrapper with hot reload while you edit

## 🚀 Run It

```sh
vsdf --toy sphere.frag
```

OR.. view it here: [ShaderToy](https://www.shadertoy.com/view/7fjSD1)

## 🛠️ Install `vsdf`

On macOS, the upstream `vsdf` README currently recommends:

```sh
brew install jamylak/vsdf/vsdf
```

For full installation notes, install instructions on other platforms, and source builds, see:

- [`jamylak/vsdf`](https://github.com/jamylak/vsdf)

## 🧮 Gradient / Normal Estimators

For an SDF, the surface normal comes from the gradient of the distance field:

```glsl
normal = normalize(gradient(distanceField))
```

The straightforward way to estimate that gradient is the classic 6-sample central difference, but this repo also includes two lower-sample alternatives in [`sphere.frag`](./sphere.frag):

- `calcNorm(p)`:
  classic central difference, sampling `+X/-X`, `+Y/-Y`, `+Z/-Z`
- `calcNormTri(p, d)`:
  forward difference, sampling only `+X`, `+Y`, `+Z` and reusing the already-known SDF value `d` from the raymarch hit point
- `calcNormTetra(p)`:
  tetrahedral sampling, using 4 offset directions arranged around the point

That means the tradeoff is roughly:

- `calcNorm(p)` = 6 extra SDF evaluations
- `calcNormTetra(p)` = 4 extra SDF evaluations
- `calcNormTri(p, d)` = 3 extra SDF evaluations when you already have the current SDF value from marching

If you want to swap the method used by the sphere shader, change the normal line in [`sphere.frag`](./sphere.frag):

```glsl
// vec3 normal = calcNorm(p);         // 6-sample central difference
// vec3 normal = calcNormTetra(p);    // 4-sample tetrahedral
vec3 normal = calcNormTri(p, d);      // 3-sample forward difference + current d
```

## 🎥 Gradient Demo Shaders

The three extra shaders in this repo are visual explanations of the probe layouts:

- [`central_6sample.frag`](./central_6sample.frag):
  shows the standard central-difference probe positions at `±X`, `±Y`, and `±Z`, with full axis bars through the origin



https://github.com/user-attachments/assets/da42fde3-f1c9-40df-a1a0-b99885b61551



- [`tri_3sample.frag`](./tri_3sample.frag):
  shows the 3 forward-difference probe positions at `+X`, `+Y`, and `+Z`, connected back to the origin


https://github.com/user-attachments/assets/7e6e9b3a-2278-4d08-99ef-63268427dea3


  
- [`tetra_4sample.frag`](./tetra_4sample.frag):
  shows the 4 tetrahedral probe positions arranged around the origin

  

https://github.com/user-attachments/assets/badf1b8a-246c-4d6a-a11d-80c3235d9cc1



These demo shaders visualize where the samples are taken. The actual estimators used by the sphere shader are `calcNorm(...)`, `calcNormTri(...)`, and `calcNormTetra(...)` inside [`sphere.frag`](./sphere.frag).

## Reference

The 4-sample tetrahedral normal trick here is in the same family as Inigo Quilez's write-up on numerical SDF normals:

- [Inigo Quilez: Numerical Normals for SDFs](https://iquilezles.org/articles/normalsSDF/)

## Tiny Map

```text
3-sample forward difference              4-sample tetrahedral

          +Z                                      k4
           |                                     /|\
           |                                    / | \
           o---- +Y                         k3 -- o -- k1
          /                                      \ | /
        +X                                        \|/
                                                    k2
```

Legend: 🔴 `+X` / `k1`, 🟢 `+Y` / `k2`, 🔵 `+Z` / `k3`, 🟡 extra tetra sample `k4`.
