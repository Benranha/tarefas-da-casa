// Gerado a partir do handoff de ícones (icons/tf-icons.js). Geometria dos ícones próprios do Tarefinha.
export type TfIconDef = { label: string; b: string; d: string; t?: string; vars?: string }

export const TF_DEFS: Record<string, TfIconDef> = {
  "vassoura": {
    "label": "Varrer",
    "b": "<rect x=\"21.5\" y=\"3\" width=\"5\" height=\"24\" rx=\"2.5\"/><rect x=\"14\" y=\"22\" width=\"20\" height=\"7\" rx=\"3\"/><path d=\"M15 28h18l5 13q-14 4-28 0z\"/>",
    "d": "<rect x=\"14\" y=\"22\" width=\"20\" height=\"7\" rx=\"3\" class=\"k\"/><path class=\"sd\" stroke-width=\"2\" d=\"M19 32l-2 7M24 32v8M29 32l2 7\"/>",
    "t": "rotate(-18 24 24)"
  },
  "cama": {
    "label": "Arrumar a cama",
    "b": "<rect x=\"5\" y=\"10\" width=\"7\" height=\"31\" rx=\"3.5\"/><rect x=\"5\" y=\"24\" width=\"38\" height=\"11\" rx=\"3.5\"/><rect x=\"36\" y=\"32\" width=\"6\" height=\"9\" rx=\"2.5\"/><rect x=\"13\" y=\"17\" width=\"12\" height=\"9\" rx=\"4\"/>",
    "d": "<path class=\"k\" d=\"M22 24h17.5a3.5 3.5 0 0 1 3.5 3.5V31H22z\"/><rect x=\"13\" y=\"17\" width=\"12\" height=\"9\" rx=\"4\" class=\"d\"/><path class=\"sd\" stroke-width=\"2\" d=\"M26 28h13\"/>"
  },
  "louca": {
    "label": "Lavar a louça",
    "b": "<circle cx=\"22\" cy=\"27\" r=\"16\"/><circle cx=\"37\" cy=\"10\" r=\"4.5\"/><circle cx=\"42.5\" cy=\"18.5\" r=\"3\"/>",
    "d": "<circle cx=\"22\" cy=\"27\" r=\"10\" class=\"sd\" stroke-width=\"2.5\"/><path class=\"sd\" stroke-width=\"2.5\" d=\"M16.5 27a5.5 5.5 0 0 1 5.5-5.5\"/><circle cx=\"35.6\" cy=\"8.6\" r=\"1.4\" class=\"d\"/>"
  },
  "escova": {
    "label": "Escovar os dentes",
    "b": "<rect x=\"20.5\" y=\"16\" width=\"7\" height=\"28\" rx=\"3.5\"/><rect x=\"19\" y=\"4\" width=\"10\" height=\"15\" rx=\"4\"/><rect x=\"27\" y=\"5\" width=\"8\" height=\"12\" rx=\"2\"/>",
    "d": "<rect x=\"27.5\" y=\"5.5\" width=\"7\" height=\"11\" rx=\"1.6\" class=\"d\"/><path class=\"sk\" stroke-width=\"1.5\" d=\"M30 6v10M32.5 6v10\"/><rect x=\"22.5\" y=\"29\" width=\"3\" height=\"11\" rx=\"1.5\" class=\"d\"/>",
    "t": "rotate(35 24 24)"
  },
  "livro": {
    "label": "Estudar",
    "b": "<path d=\"M24 13q-9-5-19-3v28q10-2 19 3q9-5 19-3V10q-10-2-19 3z\"/>",
    "d": "<path class=\"d\" d=\"M22.5 15.5q-7-3.5-14-2.3v22q7-1 14 2.3z\"/><path class=\"d\" d=\"M25.5 15.5q7-3.5 14-2.3v22q-7-1-14 2.3z\"/><path class=\"sk\" stroke-width=\"2\" d=\"M12 19.5q4-.8 7 .8M12 24.5q4-.8 7 .8M12 29.5q4-.8 7 .8M29 20.3q3-1.6 7-.8M29 25.3q3-1.6 7-.8\"/>"
  },
  "pata": {
    "label": "Cuidar do pet",
    "b": "<path d=\"M24 23c7 0 12 8 12 13s-5 6-12 6-12-1-12-6 5-13 12-13z\"/><ellipse cx=\"10.5\" cy=\"21\" rx=\"4.5\" ry=\"5.5\"/><ellipse cx=\"18.5\" cy=\"11.5\" rx=\"4.5\" ry=\"5.5\"/><ellipse cx=\"29.5\" cy=\"11.5\" rx=\"4.5\" ry=\"5.5\"/><ellipse cx=\"37.5\" cy=\"21\" rx=\"4.5\" ry=\"5.5\"/>",
    "d": "<ellipse cx=\"19\" cy=\"31\" rx=\"3\" ry=\"2\" class=\"d\" transform=\"rotate(-30 19 31)\"/><circle cx=\"17.3\" cy=\"9.5\" r=\"1.4\" class=\"d\"/><circle cx=\"28.3\" cy=\"9.5\" r=\"1.4\" class=\"d\"/>"
  },
  "cesto": {
    "label": "Roupa suja",
    "b": "<path d=\"M12.5 21q3-11 11.5-8 8.5-5 11.5 8z\"/><path d=\"M6 19h36l-4 21q-14 4-28 0z\"/>",
    "d": "<path class=\"k\" d=\"M13.5 19q2.5-9 10.5-6 8-5 10.5 6z\"/><rect x=\"10\" y=\"21.5\" width=\"6\" height=\"3\" rx=\"1.5\" class=\"d\"/><rect x=\"32\" y=\"21.5\" width=\"6\" height=\"3\" rx=\"1.5\" class=\"d\"/><path class=\"sd\" stroke-width=\"2\" d=\"M10.5 29h27M11.5 35h25\"/>"
  },
  "lixo": {
    "label": "Tirar o lixo",
    "b": "<rect x=\"19\" y=\"5\" width=\"10\" height=\"7\" rx=\"3\"/><rect x=\"8\" y=\"10\" width=\"32\" height=\"7\" rx=\"3.5\"/><path d=\"M11 16h26l-2.5 23a4 4 0 0 1-4 3.5h-13a4 4 0 0 1-4-3.5z\"/>",
    "d": "<rect x=\"22\" y=\"7.3\" width=\"4\" height=\"2.5\" rx=\"1.2\" class=\"k\"/><path class=\"sk\" stroke-width=\"2\" d=\"M10 17h28\"/><path class=\"sd\" stroke-width=\"2.5\" d=\"M19 23v13M24 23v14M29 23v13\"/>"
  },
  "planta": {
    "label": "Regar as plantas",
    "b": "<path d=\"M24 29c0-9-7-13-15-13 0 8 6 13 15 13z\"/><path d=\"M24 29c0-11 7-17 16-17 0 10-7 17-16 17z\"/><rect x=\"11\" y=\"27\" width=\"26\" height=\"6\" rx=\"3\"/><path d=\"M14 32h20l-2 9a2 2 0 0 1-2 1.5H18a2 2 0 0 1-2-1.5z\"/>",
    "d": "<rect x=\"11\" y=\"27\" width=\"26\" height=\"6\" rx=\"3\" class=\"k\"/><path class=\"sd\" stroke-width=\"2\" d=\"M13.5 19q5 3 8.5 8M36.5 15.5q-6 4-10.5 10.5\"/>"
  },
  "brinquedos": {
    "label": "Guardar brinquedos",
    "b": "<rect x=\"6\" y=\"24\" width=\"18\" height=\"18\" rx=\"3.5\"/><rect x=\"24\" y=\"24\" width=\"18\" height=\"18\" rx=\"3.5\"/><rect x=\"15\" y=\"6\" width=\"18\" height=\"18\" rx=\"3.5\"/>",
    "d": "<path class=\"sk\" stroke-width=\"2\" d=\"M24 25v16M7 24h34\"/><circle cx=\"15\" cy=\"33\" r=\"4.5\" class=\"d\"/><path class=\"d\" d=\"M33 28.5l5 8.5H28z\"/><path class=\"d\" d=\"M24.00 9.50L25.53 13.40L29.71 13.65L26.47 16.30L27.53 20.35L24.00 18.10L20.47 20.35L21.53 16.30L18.29 13.65L22.47 13.40Z\"/>"
  },
  "mochila": {
    "label": "Arrumar a mochila",
    "b": "<rect x=\"16\" y=\"4\" width=\"16\" height=\"11\" rx=\"5.5\"/><rect x=\"9\" y=\"11\" width=\"30\" height=\"31\" rx=\"9\"/>",
    "d": "<rect x=\"20\" y=\"7.5\" width=\"8\" height=\"5\" rx=\"2.5\" class=\"k\"/><rect x=\"14\" y=\"25\" width=\"20\" height=\"12\" rx=\"4\" class=\"d\"/><path class=\"sk\" stroke-width=\"2\" d=\"M14.5 30h19\"/><circle cx=\"24\" cy=\"30\" r=\"2\" class=\"k\"/>"
  },
  "chuveiro": {
    "label": "Tomar banho",
    "b": "<rect x=\"21.5\" y=\"3\" width=\"5\" height=\"8\" rx=\"2.5\"/><path d=\"M10 21a14 12 0 0 1 28 0z\"/><ellipse cx=\"15\" cy=\"29\" rx=\"2.6\" ry=\"3.6\"/><ellipse cx=\"24\" cy=\"31\" rx=\"2.6\" ry=\"3.6\"/><ellipse cx=\"33\" cy=\"29\" rx=\"2.6\" ry=\"3.6\"/><ellipse cx=\"19\" cy=\"39.5\" rx=\"2.6\" ry=\"3.6\"/><ellipse cx=\"29\" cy=\"39.5\" rx=\"2.6\" ry=\"3.6\"/>",
    "d": "<rect x=\"10.5\" y=\"18\" width=\"27\" height=\"3.5\" rx=\"1.75\" class=\"k\"/><circle cx=\"18\" cy=\"15\" r=\"1.5\" class=\"d\"/><circle cx=\"24\" cy=\"13.5\" r=\"1.5\" class=\"d\"/><circle cx=\"30\" cy=\"15\" r=\"1.5\" class=\"d\"/>"
  },
  "talheres": {
    "label": "Pôr a mesa",
    "b": "<ellipse cx=\"15\" cy=\"13\" rx=\"6.5\" ry=\"8.5\"/><rect x=\"13\" y=\"19\" width=\"4\" height=\"23\" rx=\"2\"/><path d=\"M27 5h14v9a7 7 0 0 1-14 0z\"/><rect x=\"32\" y=\"18\" width=\"4\" height=\"24\" rx=\"2\"/>",
    "d": "<path class=\"sd\" stroke-width=\"2\" d=\"M31.5 4v9M36.5 4v9\"/><ellipse cx=\"13.3\" cy=\"10.5\" rx=\"2\" ry=\"3\" class=\"d\"/>"
  },
  "lapis": {
    "label": "Lição de casa",
    "b": "<rect x=\"19\" y=\"3\" width=\"10\" height=\"8\" rx=\"3\"/><rect x=\"19\" y=\"9\" width=\"10\" height=\"24\" rx=\"1\"/><path d=\"M19 32h10l-5 11z\"/>",
    "d": "<rect x=\"19\" y=\"3\" width=\"10\" height=\"7\" rx=\"3\" class=\"k\"/><rect x=\"19\" y=\"9\" width=\"10\" height=\"3.5\" class=\"d\"/><path class=\"d\" d=\"M19.6 33h8.8L24 42.6z\"/><path class=\"k\" d=\"M22.3 38.6h3.4L24 42.4z\"/><path class=\"sk\" stroke-width=\"1.6\" d=\"M24 15v15\"/>",
    "t": "rotate(40 24 24)"
  },
  "camiseta": {
    "label": "Dobrar a roupa",
    "b": "<path d=\"M17 7 7 13.5l4.5 9 4-2V41h17V20.5l4 2 4.5-9L31 7q-7 6-14 0z\"/>",
    "d": "<path class=\"sd\" stroke-width=\"2.4\" d=\"M19.5 8.5q4.5 4 9 0\"/><path class=\"sk\" stroke-width=\"2\" d=\"M9.6 18.4l4-2M38.4 18.4l-4-2\"/><rect x=\"25.5\" y=\"22\" width=\"5\" height=\"5\" rx=\"1.2\" class=\"d\"/>"
  },
  "limpeza": {
    "label": "Limpar",
    "b": "<path d=\"M14 6h15a2 2 0 0 1 2 2v2h5v4h-5v1H16l-4-6a2 2 0 0 1 2-3z\"/><rect x=\"17\" y=\"14\" width=\"11\" height=\"7\" rx=\"2\"/><rect x=\"13\" y=\"19\" width=\"19\" height=\"23\" rx=\"6\"/><circle cx=\"40\" cy=\"7.5\" r=\"1.8\"/><circle cx=\"42.5\" cy=\"12\" r=\"1.8\"/><circle cx=\"40\" cy=\"16.5\" r=\"1.8\"/>",
    "d": "<rect x=\"16.5\" y=\"25\" width=\"12\" height=\"11\" rx=\"2.5\" class=\"d\"/><path class=\"sk\" stroke-width=\"2\" d=\"M19.5 29h6M19.5 32.5h4\"/>"
  },
  "presente": {
    "label": "Presente",
    "b": "<path d=\"M24 14C20 5 10 6 13 12.5Q14 14 17 14zM24 14C28 5 38 6 35 12.5Q34 14 31 14z\"/><rect x=\"6\" y=\"13\" width=\"36\" height=\"10\" rx=\"3\"/><rect x=\"9\" y=\"21\" width=\"30\" height=\"21\" rx=\"3\"/>",
    "d": "<path class=\"sk\" stroke-width=\"2\" d=\"M9.5 23h29\"/><rect x=\"21\" y=\"13\" width=\"6\" height=\"29\" class=\"d\"/><path class=\"k\" d=\"M23 13.5C20 8 15 8.5 16 11.5q.6 1.5 3 2z\"/>"
  },
  "sorvete": {
    "label": "Sorvete",
    "b": "<circle cx=\"17\" cy=\"19\" r=\"7.5\"/><circle cx=\"31\" cy=\"19\" r=\"7.5\"/><circle cx=\"24\" cy=\"12\" r=\"8\"/><path d=\"M14 23h20L24 44z\"/>",
    "d": "<path class=\"d\" d=\"M14.8 24h18.4L24 42.5z\"/><path class=\"sk\" stroke-width=\"1.6\" d=\"M18 27l9 9M23 25.5l6 6M30 27l-9 9M25 25.5l-6 6\"/><path class=\"sd\" stroke-width=\"1.8\" d=\"M21 9l2 1M27 13l1.5-1.5M14 18l1.5 1M33 17l1-1.6\"/>"
  },
  "videogame": {
    "label": "Videogame",
    "b": "<path d=\"M15 13h18c7 0 11 6 11 14 0 8-3 12-7 12-3 0-4-2-6-5H17c-2 3-3 5-6 5-4 0-7-4-7-12 0-8 4-14 11-14z\"/>",
    "d": "<rect x=\"10\" y=\"22\" width=\"11\" height=\"4\" rx=\"1.5\" class=\"d\"/><rect x=\"13.5\" y=\"18.5\" width=\"4\" height=\"11\" rx=\"1.5\" class=\"d\"/><circle cx=\"31\" cy=\"21\" r=\"2.4\" class=\"d\"/><circle cx=\"36\" cy=\"26\" r=\"2.4\" class=\"d\"/><circle cx=\"30.5\" cy=\"29.5\" r=\"1.6\" class=\"k\"/>"
  },
  "cinema": {
    "label": "Cinema",
    "b": "<g transform=\"rotate(-14 7 19)\"><rect x=\"6\" y=\"11\" width=\"35\" height=\"8\" rx=\"2\"/></g><rect x=\"6\" y=\"19\" width=\"36\" height=\"23\" rx=\"3\"/>",
    "d": "<g transform=\"rotate(-14 7 19)\"><path class=\"d\" d=\"M12 11h5l-4 8H8zM24 11h5l-4 8h-5zM36 11h4.5l-4 8H32z\"/></g><path class=\"sk\" stroke-width=\"2\" d=\"M6.5 26h35\"/><path class=\"sd\" stroke-width=\"2.4\" d=\"M12 32h24M12 37h14\"/>"
  },
  "pizza": {
    "label": "Pizza",
    "b": "<path d=\"M24 44 7 13q17-9 34 0z\"/>",
    "d": "<path class=\"d\" d=\"M7 13q17-9 34 0l-2.3 4.3Q24 10 9.3 17.3z\"/><circle cx=\"21\" cy=\"22\" r=\"3.2\" class=\"k\"/><circle cx=\"29\" cy=\"26\" r=\"2.8\" class=\"k\"/><circle cx=\"23\" cy=\"33\" r=\"2.4\" class=\"k\"/><path class=\"sd\" stroke-width=\"1.6\" d=\"M17 28l1.5 1M31 19.5l1 1.5M26.5 36.5l-1 1\"/>"
  },
  "ursinho": {
    "label": "Brinquedo",
    "b": "<circle cx=\"12\" cy=\"12\" r=\"6.5\"/><circle cx=\"36\" cy=\"12\" r=\"6.5\"/><circle cx=\"24\" cy=\"26\" r=\"16\"/>",
    "d": "<circle cx=\"12\" cy=\"12\" r=\"3\" class=\"d\"/><circle cx=\"36\" cy=\"12\" r=\"3\" class=\"d\"/><ellipse cx=\"24\" cy=\"32\" rx=\"8\" ry=\"6\" class=\"d\"/><ellipse cx=\"24\" cy=\"29.5\" rx=\"3\" ry=\"2.2\" class=\"k\"/><path class=\"sk\" stroke-width=\"1.8\" d=\"M24 31.5v2.5M21 35q3 2 6 0\"/><circle cx=\"17.5\" cy=\"23\" r=\"2.2\" class=\"k\"/><circle cx=\"30.5\" cy=\"23\" r=\"2.2\" class=\"k\"/>"
  },
  "bicicleta": {
    "label": "Passeio de bike",
    "b": "<circle cx=\"12\" cy=\"31\" r=\"8\" fill=\"none\" stroke-width=\"{L}\"/><circle cx=\"36\" cy=\"31\" r=\"8\" fill=\"none\" stroke-width=\"{L}\"/><path fill=\"none\" stroke-width=\"{L}\" d=\"M12 31l7-13h12l5 13M19 18l5 13 7-13M16.5 13h6M31 18l-2-6h5\"/><circle cx=\"12\" cy=\"31\" r=\"3\"/><circle cx=\"36\" cy=\"31\" r=\"3\"/><circle cx=\"24\" cy=\"31\" r=\"3.5\"/>",
    "d": "<circle cx=\"12\" cy=\"31\" r=\"1.3\" class=\"d\"/><circle cx=\"36\" cy=\"31\" r=\"1.3\" class=\"d\"/><circle cx=\"24\" cy=\"31\" r=\"1.6\" class=\"d\"/>"
  },
  "historia": {
    "label": "Livro de histórias",
    "b": "<rect x=\"9\" y=\"5\" width=\"30\" height=\"38\" rx=\"4\"/>",
    "d": "<path class=\"k\" d=\"M13 5h3v38h-3a4 4 0 0 1-4-4V9a4 4 0 0 1 4-4z\"/><path class=\"d\" d=\"M16 36h23v3a4 4 0 0 1-4 4H16z\"/><path class=\"sk\" stroke-width=\"1.5\" d=\"M18 39.5h18\"/><path class=\"d\" d=\"M27.50 12.50L29.38 17.41L34.63 17.68L30.54 20.99L31.91 26.07L27.50 23.20L23.09 26.07L24.46 20.99L20.37 17.68L25.62 17.41Z\"/>"
  },
  "menino": {
    "label": "Menino",
    "b": "<circle cx=\"24\" cy=\"24\" r=\"16\"/><circle cx=\"8.5\" cy=\"27\" r=\"3.5\"/><circle cx=\"39.5\" cy=\"27\" r=\"3.5\"/>",
    "d": "<circle cx=\"8.5\" cy=\"27\" r=\"2\" class=\"d\"/><circle cx=\"39.5\" cy=\"27\" r=\"2\" class=\"d\"/><path class=\"d\" d=\"M11 26q0 14 13 14t13-14q0-5-3-8-9 5-20 1-3 3-3 7z\"/><circle cx=\"19\" cy=\"28\" r=\"1.9\" class=\"k\"/><circle cx=\"29\" cy=\"28\" r=\"1.9\" class=\"k\"/><path class=\"sk\" stroke-width=\"2.2\" d=\"M20 33.5q4 3 8 0\"/>"
  },
  "menina": {
    "label": "Menina",
    "b": "<circle cx=\"24\" cy=\"23\" r=\"15\"/><circle cx=\"8\" cy=\"27\" r=\"6\"/><circle cx=\"40\" cy=\"27\" r=\"6\"/><rect x=\"10\" y=\"22\" width=\"28\" height=\"18\" rx=\"9\"/>",
    "d": "<path class=\"d\" d=\"M12 27q0 13 12 13t12-13q-3-8-12-10-9 2-12 10z\"/><circle cx=\"12.5\" cy=\"21\" r=\"2.2\" class=\"d\"/><circle cx=\"35.5\" cy=\"21\" r=\"2.2\" class=\"d\"/><circle cx=\"19\" cy=\"29\" r=\"1.9\" class=\"k\"/><circle cx=\"29\" cy=\"29\" r=\"1.9\" class=\"k\"/><path class=\"sk\" stroke-width=\"2.2\" d=\"M20 34.5q4 3 8 0\"/>"
  },
  "cacheado": {
    "label": "Cabelo cacheado",
    "b": "<circle cx=\"14\" cy=\"17\" r=\"7\"/><circle cx=\"24\" cy=\"12\" r=\"8\"/><circle cx=\"34\" cy=\"17\" r=\"7\"/><circle cx=\"10\" cy=\"27\" r=\"6\"/><circle cx=\"38\" cy=\"27\" r=\"6\"/><circle cx=\"24\" cy=\"28\" r=\"14\"/>",
    "d": "<circle cx=\"24\" cy=\"30.5\" r=\"10.5\" class=\"d\"/><circle cx=\"19\" cy=\"21\" r=\"3.2\" class=\"b\"/><circle cx=\"25\" cy=\"20\" r=\"3.2\" class=\"b\"/><circle cx=\"30.5\" cy=\"21.5\" r=\"2.8\" class=\"b\"/><circle cx=\"19\" cy=\"30\" r=\"1.9\" class=\"k\"/><circle cx=\"29\" cy=\"30\" r=\"1.9\" class=\"k\"/><path class=\"sk\" stroke-width=\"2.2\" d=\"M20 35.5q4 3 8 0\"/>"
  },
  "bebe": {
    "label": "Bebê",
    "b": "<circle cx=\"24\" cy=\"26\" r=\"16\"/><path fill=\"none\" stroke-width=\"{L}\" d=\"M24 10q2-6 7-4\"/>",
    "d": "<circle cx=\"24\" cy=\"26.5\" r=\"13\" class=\"d\"/><path class=\"sk\" stroke-width=\"2\" d=\"M16.5 25q2.5-2.5 5 0M26.5 25q2.5-2.5 5 0M21 31.5q3 2.5 6 0\"/><circle cx=\"15.5\" cy=\"30\" r=\"2.2\" class=\"b\" opacity=\".35\"/><circle cx=\"32.5\" cy=\"30\" r=\"2.2\" class=\"b\" opacity=\".35\"/>"
  },
  "jovem": {
    "label": "Cabelo comprido",
    "b": "<path d=\"M8 41V23Q8 7 24 7t16 16v18q0 2-2 2H10q-2 0-2-2z\"/>",
    "d": "<ellipse cx=\"24\" cy=\"26.5\" rx=\"10.5\" ry=\"12.5\" class=\"d\"/><path class=\"b\" d=\"M13.5 23q1-10 10.5-10t10.5 10q-5-5-11-5.5-6 .5-10 5.5z\"/><circle cx=\"19\" cy=\"28\" r=\"1.9\" class=\"k\"/><circle cx=\"29\" cy=\"28\" r=\"1.9\" class=\"k\"/><path class=\"sk\" stroke-width=\"2.2\" d=\"M20 33.5q4 3 8 0\"/>"
  },
  "gato": {
    "label": "Gato",
    "b": "<path d=\"M8 19 9 5l10 8q5-1.5 10 0l10-8 1 14q3 6 0 12-5 11-16 11T8 31q-3-6 0-12z\"/>",
    "d": "<path class=\"d\" d=\"M11 10.5l6 4.5-5 3z\"/><path class=\"d\" d=\"M37 10.5l-6 4.5 5 3z\"/><ellipse cx=\"24\" cy=\"32.5\" rx=\"8\" ry=\"6\" class=\"d\"/><path class=\"k\" d=\"M21.5 30h5L24 33z\"/><path class=\"sk\" stroke-width=\"1.8\" d=\"M24 33v2M21 36q3 1.6 6 0\"/><ellipse cx=\"18.5\" cy=\"24\" rx=\"2.6\" ry=\"3\" class=\"d\"/><ellipse cx=\"29.5\" cy=\"24\" rx=\"2.6\" ry=\"3\" class=\"d\"/><circle cx=\"18.9\" cy=\"24.5\" r=\"1.5\" class=\"k\"/><circle cx=\"29.9\" cy=\"24.5\" r=\"1.5\" class=\"k\"/>"
  },
  "cachorro": {
    "label": "Cachorro",
    "b": "<ellipse cx=\"10\" cy=\"22\" rx=\"6\" ry=\"11\" transform=\"rotate(18 10 22)\"/><ellipse cx=\"38\" cy=\"22\" rx=\"6\" ry=\"11\" transform=\"rotate(-18 38 22)\"/><circle cx=\"24\" cy=\"25\" r=\"15\"/>",
    "d": "<ellipse cx=\"10\" cy=\"22\" rx=\"6\" ry=\"11\" transform=\"rotate(18 10 22)\" class=\"k\"/><ellipse cx=\"38\" cy=\"22\" rx=\"6\" ry=\"11\" transform=\"rotate(-18 38 22)\" class=\"k\"/><ellipse cx=\"24\" cy=\"32\" rx=\"9\" ry=\"7\" class=\"d\"/><ellipse cx=\"24\" cy=\"28.5\" rx=\"3.6\" ry=\"2.6\" class=\"k\"/><path class=\"sk\" stroke-width=\"1.8\" d=\"M24 31v2.5M20.5 34.5q3.5 2 7 0\"/><ellipse cx=\"18.5\" cy=\"22\" rx=\"2.6\" ry=\"3\" class=\"d\"/><ellipse cx=\"29.5\" cy=\"22\" rx=\"2.6\" ry=\"3\" class=\"d\"/><circle cx=\"18.9\" cy=\"22.5\" r=\"1.5\" class=\"k\"/><circle cx=\"29.9\" cy=\"22.5\" r=\"1.5\" class=\"k\"/>"
  },
  "unicornio": {
    "label": "Unicórnio",
    "b": "<path d=\"M24 2l4.5 13h-9z\"/><path d=\"M13 15l1.5-8 6.5 5zM35 15l-1.5-8-6.5 5z\"/><circle cx=\"24\" cy=\"27\" r=\"14\"/>",
    "d": "<path class=\"d\" d=\"M24 3.5l3.6 10.5h-7.2z\"/><path class=\"sk\" stroke-width=\"1.5\" d=\"M21.7 11h4.6M22.6 7.8h2.8\"/><path class=\"k\" d=\"M14 18q4-6 10-5.5 6-.5 10 5.5-4-2.5-10-2T14 18z\"/><ellipse cx=\"24\" cy=\"34.5\" rx=\"7.5\" ry=\"5\" class=\"d\"/><circle cx=\"21.5\" cy=\"34.5\" r=\"1.2\" class=\"k\"/><circle cx=\"26.5\" cy=\"34.5\" r=\"1.2\" class=\"k\"/><ellipse cx=\"18.5\" cy=\"26\" rx=\"2.6\" ry=\"3\" class=\"d\"/><ellipse cx=\"29.5\" cy=\"26\" rx=\"2.6\" ry=\"3\" class=\"d\"/><circle cx=\"18.9\" cy=\"26.5\" r=\"1.5\" class=\"k\"/><circle cx=\"29.9\" cy=\"26.5\" r=\"1.5\" class=\"k\"/>"
  },
  "estrela": {
    "label": "Pontos",
    "b": "<path d=\"M24.00 7.00L29.00 18.12L41.12 19.44L32.08 27.63L34.58 39.56L24.00 33.50L13.42 39.56L15.92 27.63L6.88 19.44L19.00 18.12Z\"/>",
    "d": "<path class=\"sd\" stroke-width=\"2.4\" d=\"M17.5 22.5q1-3 3.6-4\"/>",
    "vars": "--ic-b:var(--ic-star,#FFC93C);--ic-k:#B07A00;--ic-d:#FFF8EF"
  },
  "festa": {
    "label": "Festa",
    "b": "<path d=\"M6 42l9-25 16 16z\"/><circle cx=\"30\" cy=\"10\" r=\"2.6\"/><rect x=\"36\" y=\"15\" width=\"5\" height=\"5\" rx=\"1.2\" transform=\"rotate(20 38.5 17.5)\"/><path fill=\"none\" stroke-width=\"{L}\" d=\"M37 28.5q3.5-1.5 5 1.5\"/><path fill=\"none\" stroke-width=\"{L}\" d=\"M22 7q-1.5 3 1.5 5.5\"/><circle cx=\"41\" cy=\"7\" r=\"2\"/>",
    "d": "<path class=\"sd\" stroke-width=\"2.4\" d=\"M12.5 25.5l10 10M9.5 33.5l5 5\"/>"
  },
  "recado": {
    "label": "Recado",
    "b": "<path d=\"M12 8h24a4 4 0 0 1 4 4v16a4 4 0 0 1-4 4H21l-8 8v-8h-1a4 4 0 0 1-4-4V12a4 4 0 0 1 4-4z\"/>",
    "d": "<circle cx=\"17\" cy=\"20\" r=\"2.6\" class=\"d\"/><circle cx=\"24\" cy=\"20\" r=\"2.6\" class=\"d\"/><circle cx=\"31\" cy=\"20\" r=\"2.6\" class=\"d\"/>"
  },
  "brilho": {
    "label": "Outra tarefa",
    "b": "<path d=\"M21 10Q23.56 23.44 37 26Q23.56 28.56 21 42Q18.44 28.56 5 26Q18.44 23.44 21 10Z\"/><path d=\"M37.5 3.5Q38.54 8.96 44 10Q38.54 11.04 37.5 16.5Q36.46 11.04 31 10Q36.46 8.96 37.5 3.5Z\"/>",
    "d": "<path class=\"d\" d=\"M21 21.5Q21.72 25.28 25.5 26Q21.72 26.72 21 30.5Q20.28 26.72 16.5 26Q20.28 25.28 21 21.5Z\"/>"
  }
}

export const TF_GROUPS = {
  "tarefas": [
    "vassoura",
    "cama",
    "louca",
    "escova",
    "livro",
    "pata",
    "cesto",
    "lixo",
    "planta",
    "brinquedos",
    "mochila",
    "chuveiro",
    "talheres",
    "lapis",
    "camiseta",
    "limpeza"
  ],
  "recompensas": [
    "presente",
    "sorvete",
    "videogame",
    "cinema",
    "pizza",
    "ursinho",
    "bicicleta",
    "historia"
  ],
  "avatares": [
    "menino",
    "menina",
    "cacheado",
    "bebe",
    "jovem",
    "gato",
    "cachorro",
    "unicornio"
  ],
  "extras": [
    "estrela",
    "festa",
    "recado",
    "brilho"
  ]
} as const

export const TF_FROM_EMOJI: Record<string, string> = {
  "🧹": "vassoura",
  "🛏️": "cama",
  "🛏": "cama",
  "🍽️": "louca",
  "🍽": "louca",
  "🪥": "escova",
  "📚": "livro",
  "🐾": "pata",
  "🧺": "cesto",
  "🗑️": "lixo",
  "🗑": "lixo",
  "✨": "brilho",
  "🎁": "presente",
  "🍦": "sorvete",
  "🎮": "videogame",
  "🎬": "cinema",
  "🍕": "pizza",
  "🧸": "ursinho",
  "🚲": "bicicleta",
  "📖": "historia",
  "👦": "menino",
  "👧": "menina",
  "🧒": "cacheado",
  "👶": "bebe",
  "🧑": "jovem",
  "🐱": "gato",
  "🐶": "cachorro",
  "🦄": "unicornio",
  "⭐": "estrela",
  "🎉": "festa",
  "💬": "recado"
}
