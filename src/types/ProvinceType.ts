export interface RawGeojson {
    type:     string;
    name:     string;
    crs:      CRS;
    features: Feature[];
}

export interface CRS {
    type:       string;
    properties: CRSProperties;
}

export interface CRSProperties {
    name: string;
}

export interface Feature {
    type:       FeatureType;
    properties: FeatureProperties;
    geometry:   Geometry;
}

export interface Geometry {
    type:        GeometryType;
    coordinates: Array<Array<Array<number[]>>>;
}

export enum GeometryType {
    MultiPolygon = "MultiPolygon",
}

export interface FeatureProperties extends ListDatum{
    cartodb_id:   number;
    id_1:         number;
    province_id:  number;
    name:         string;
    country:      Country;
    slug:         string;
    state:        string;
    sample_value: number;
    hospital_count: number;
    lab_count:  number;
}

export enum Country {
    Indonesia = "Indonesia",
}

export enum FeatureType {
    Feature = "Feature",
}

export interface RawCovidData {
    last_date:      string;
    current_data:   number;
    missing_data:   number;
    tanpa_provinsi: number;
    list_data:      ListDatum[];
}

export interface ListDatum {
    key:              string;
    doc_count:        number;
    jumlah_kasus:     number;
    jumlah_sembuh:    number;
    jumlah_meninggal: number;
    jumlah_dirawat:   number;
    jenis_kelamin:    JenisKelamin[];
    kelompok_umur:    KelompokUmur[];
    lokasi:           Lokasi;
    penambahan:       Penambahan;
}

export interface JenisKelamin {
    key:       JenisKelaminKey;
    doc_count: number;
}

export enum JenisKelaminKey {
    LakiLaki = "LAKI-LAKI",
    Perempuan = "PEREMPUAN",
}

export interface KelompokUmur {
    key:       KelompokUmurKey;
    doc_count: number;
    usia:      Usia;
}

export enum KelompokUmurKey {
    The05 = "0-5",
    The1930 = "19-30",
    The3145 = "31-45",
    The4659 = "46-59",
    The60 = "≥ 60",
    The618 = "6-18",
}

export interface Usia {
    value: number;
}

export interface Lokasi {
    lon: number;
    lat: number;
}

export interface Penambahan {
    positif:   number;
    sembuh:    number;
    meninggal: number;
}

