/**
 * Identitas perusahaan untuk semua dokumen cetak (faktur, SPK, slip upah).
 * Satu sumber supaya alamat dan telepon tidak berbeda antar dokumen —
 * ubah di sini, semua cetakan ikut berubah.
 */
export const COMPANY = {
  name: "THE WINNER SPORT",
  addressLines: [
    "Jl. Raya Pasar Minggu No.5, RT.6/RW.5, Pejaten Bar., Ps. Minggu",
    "Kota Jakarta Selatan, Daerah Khusus Ibukota Jakarta 12510"
  ],
  phone: "0856-9255-9072"
} as const;

/** Alamat satu baris, untuk dokumen ringkas seperti slip upah. */
export const COMPANY_ADDRESS_ONE_LINE = COMPANY.addressLines.join(", ");
