export interface HospitalType {
    nama:         string;
    kode_rs:      string;
    tempat_tidur: number;
    telepon?:     string;
    lokasi?:      Lokasi;
    alamat?:      string;
    tipe?:        Tipe;
    wilayah:      string;
}

export interface Lokasi {
    lat: number;
    lon: number;
}

export enum Tipe {
    Empty = "",
    Rs = "RS",
    RsRujukanNasional = "RS_RUJUKAN_NASIONAL",
    RsRujukanProvinsi = "RS_RUJUKAN_PROVINSI",
}


export interface LabType {
    nama_lab:     string;
    lat:          string;
    lon:          string;
    alamat:       string;
    kontak_phone: null | string;
    provinsi:     null | string;
}



