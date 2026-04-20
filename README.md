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
