export interface Problem {
  id: string;
  title: string;
  competition: string; // 'ONMIPA', 'IMC', 'OSN', dll.
  year: number;
  level: string; // 'Kabupaten', 'Provinsi', 'Nasional', 'Wilayah'
  topic: string;
  statement: string;
  solutionBrief: string;
  solutionSteps: string[];
  finalAnswer: string;
}

export const problemsData: Problem[] = [
  {
    id: "ONMIPA-2026-WIL-01",
    title: "Penempatan Bola dalam Kotak",
    competition: "ONMIPA",
    year: 2026,
    level: "Wilayah",
    topic: "Kombinatorika",
    statement: "Tentukan banyaknya cara menempatkan $n$ bola berbeda ke dalam $n$ kotak berbeda sehingga tepat satu kotak kosong.",
    solutionBrief: "Penempatan yang diminta akan memiliki 1 kotak kosong, $n-2$ kotak berisi 1 bola, dan 1 kotak berisi 2 bola.",
    solutionSteps: [
      "Banyaknya cara memilih 1 kotak kosong dan 1 kotak berisi 2 bola adalah $n(n-1)$.",
      "Pilih 2 bola yang akan berada dalam kotak yang sama sebanyak $\\binom{n}{2}$ cara, lalu susun sisanya sebanyak $(n-2)!$ cara."
    ],
    finalAnswer: "\\frac{n(n-1)n!}{2}"
  },
  {
    id: "OSN-2025-SMA-01",
    title: "Ketaksamaan Tiga Variabel",
    competition: "OSN",
    year: 2025,
    level: "Nasional",
    topic: "Aljabar",
    statement: "Misalkan $a, b, c > 0$ memenuhi $abc = 1$. Buktikan bahwa $\\frac{1}{a+b+1} + \\frac{1}{b+c+1} + \\frac{1}{c+a+1} \\le 1$.",
    solutionBrief: "Gunakan substitusi $a = x/y, b = y/z, c = z/x$ untuk menyederhanakan bentuk pecahan.",
    solutionSteps: [
      "Lakukan substitusi variabel $a = \\frac{x}{y}, b = \\frac{y}{z}, c = \\frac{z}{x}$.",
      "Sederhanakan suku pertama menjadi $\\frac{z}{x+y+z}$.",
      "Penjumlahan ketiga suku menghasilkan $\\frac{x+y+z}{x+y+z} = 1$."
    ],
    finalAnswer: "\\text{Terbukti}"
  }
];