# Rendering textures / 渲染贴图

`concrete-wall/` contains Poly Haven Concrete Wall 008 base colour (sRGB), roughness and OpenGL normals (linear). The physical coverage is 2.71 m. Shared texture maps use per-material UV scaling to limit GPU memory use.

混凝土墙面贴图用于精细渲染，按 2.71 m 实际尺度重复。多个墙面共享贴图，通过材质 UV 参数调整尺度以减少显存占用。

Source / 来源: https://polyhaven.com/a/concrete_wall_008
License / 许可: CC0, https://polyhaven.com/license
Credits / 作者: Charlotte Baglioni (Photography), Dario Barresi (Processing).

PV cells, metal roof and concrete ground are procedural illustrations. They are not manufacturer specifications or construction drawings.
组件电池片、彩钢屋面和水泥地坪采用程序材质，仅用于方案示意，不代表厂家规格或施工图。
