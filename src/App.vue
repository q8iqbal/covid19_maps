<template>
  <header-bar>
    <o-button variant="primary" icon-left="home" @click="returnHome" />
    <o-button @click="changeClassification(ClassificationData.CASES)"
      >Jumlah Kasus Terpapar</o-button
    >
    <o-button @click="changeClassification(ClassificationData.CURRENTLY_TREATED)">
      Jumlah Dirawat
    </o-button>
    <o-button @click="changeClassification(ClassificationData.RECOVERED)">
      Jumlah Sembuh
    </o-button>
    <o-button @click="changeClassification(ClassificationData.DEAD)">
      Jumlah Kematian
    </o-button>
    <o-button @click="changeClassification(ClassificationData.MALE)"
      >Kelompok Pria</o-button
    >
    <o-button @click="changeClassification(ClassificationData.FEMALE)"
      >Kelompok Wanita</o-button
    >
  </header-bar>

  <div id="map"></div>
</template>

<script lang="ts" setup>
import { ScaleQuantile, scaleQuantile } from "d3";
import L, { Layer, StyleFunction } from "leaflet";
import { computed, onMounted, ref } from "vue";
import HeaderBar from "./components/HeaderBar.vue";
import { ClassificationData } from "./types/ClassificationEnum";
import { HospitalType, LabType } from "./types/MedicalFacilityType";
import {
  Feature,
  FeatureProperties,
  JenisKelaminKey,
  KelompokUmurKey,
  RawCovidData,
  RawGeojson,
} from "./types/ProvinceType";

const defaultZoom = 5;
const defaultCoor = L.latLng(-0.967, 120.146);
// const color = ["#fee5d9", "#fcae91", "#fb6a4a", "#de2d26", "#a50f15"];
const color = computed<string[]>(() => {
  switch (selectedClassification.value) {
    case ClassificationData.RECOVERED:
      return ["#edf8fb", "#b2e2e2", "#66c2a4", "#2ca25f", "#006d2c"];
    default:
      return ["#fee5d9", "#fcae91", "#fb6a4a", "#de2d26", "#a50f15"];
  }
});

const date = ref(new Date());
const quantile = ref<ScaleQuantile<string, number>>();
const indoMap = ref<GeoJSON.GeoJsonObject | RawGeojson>();
const selectedClassification = ref(ClassificationData.CASES);

let map: L.Map | undefined;
let geojson: L.GeoJSON | undefined;
let legend: L.Control.Attribution | undefined;

const mapStyle: StyleFunction<FeatureProperties> = (feature) => {
  return {
    fillColor:
      quantile.value && feature
        ? (quantile.value(
            getFeaturePropertiesBasedOnClassification(feature.properties)
          ) as string)
        : "#000",
    weight: 2,
    opacity: 1,
    color: "white",
    dashArray: "3",
    fillOpacity: 0.7,
  };
};

async function initMaps() {
  map = L.map("map").setView(defaultCoor, defaultZoom);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: `© Iqbal | Tercatat pada ${date.value.toLocaleDateString()}`,
  }).addTo(map);

  indoMap.value = await concatJson();
  await countFacility(indoMap.value as RawGeojson);
}

async function loadGeojson() {
  if (geojson && map) {
    geojson.removeFrom(map);
  }

  if (map && indoMap.value) {
    geojson = L.geoJSON(indoMap.value as GeoJSON.GeoJsonObject, {
      style: mapStyle,
      onEachFeature: onEachFeature,
    }).addTo(map);
  }
}

function highlightFeature(e: L.LeafletMouseEvent) {
  const layer = e.target;
  const featureProps = layer.feature as Feature;
  if (layer) {
    layer
      .bindTooltip(
        `
        <p class="subtitle has-text-centered is-capitalized mb-2">
        ${featureProps.properties.state}
        </p>

        terhitung : ${getFeaturePropertiesBasedOnClassification(
          featureProps.properties
        )} orang
        <br>
        Jumlah RS : ${featureProps.properties.hospital_count}
        <br>
        Jumlah Lab : ${featureProps.properties.lab_count}
        `
      )
      .openTooltip();

    layer.setStyle({
      weight: 5,
      color: "#666",
      dashArray: "",
      fillOpacity: 0.7,
    });

    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
      layer.bringToFront();
    }
  }
}

function resetHighlight(e: L.LeafletMouseEvent) {
  if (geojson) {
    geojson.resetStyle(e.target);
    geojson.unbindTooltip();
  }
}

function zoomToFeature(e: L.LeafletMouseEvent) {
  if (map) {
    map.fitBounds(e.target.getBounds());
  }
}

function returnHome() {
  if (map) {
    map.setView(defaultCoor, defaultZoom);
  }
}

function onEachFeature(feature: GeoJSON.Feature, layer: Layer) {
  layer.on({
    mouseover: highlightFeature,
    mouseout: resetHighlight,
    click: zoomToFeature,
  });
}

async function concatJson() {
  // get covid data
  const response = await fetch("prov.json");
  const covidData: RawCovidData = await response.json();

  // get geojson
  const response2 = await fetch("all_maps_state_indo.geojson");
  const indoMap: RawGeojson = await response2.json();

  date.value = new Date(covidData.last_date);

  indoMap.features.map((currentMapValue) => {
    const data = covidData.list_data.find((currentCovidValue) => {
      return currentCovidValue.key == currentMapValue.properties.state;
    });
    currentMapValue.properties = Object.assign({}, currentMapValue.properties, data);
    return currentMapValue;
  });

  return indoMap as GeoJSON.GeoJsonObject | RawGeojson;
}

function addLegend(title: string) {
  if (legend) {
    legend.remove();
  }

  if (map && quantile.value != undefined) {
    legend = L.control.attribution({ position: "bottomright" });

    legend.onAdd = function () {
      let div = L.DomUtil.create("div", "info legend");
      let grades = quantile.value ? quantile.value.quantiles() : [0, 1, 2, 3];
      div.innerHTML += `
        <p class="subtitle has-text-centered mb-2 is-capitalized"> ${title} </p>
      `;

      div.innerHTML +=
        '<i style="background:' +
        color.value[4] +
        '"></i> ' +
        "< " +
        Math.floor(grades[0]) +
        "<br>";

      // loop through our density intervals and generate a label with a colored square for each interval
      for (let i = 0; i < 4; i++) {
        div.innerHTML +=
          '<i style="background:' +
          color.value[i] +
          '"></i> ' +
          (Math.floor(grades[i + 1])
            ? `${Math.floor(grades[i])} &ndash;` + Math.floor(grades[i + 1]) + "<br>"
            : `> ${Math.floor(grades[i])}`);
      }

      return div;
    };

    legend.addTo(map);
  }
}

async function changeClassification(classification: ClassificationData) {
  selectedClassification.value = classification;

  if (indoMap.value) {
    const domain = getFeatureDomainBasedOnClassification(
      (indoMap.value as RawGeojson).features
    );
    quantile.value = scaleQuantile(color.value).domain(domain);
    await loadGeojson();
    addLegend("legend");
  }
}

function getFeaturePropertiesBasedOnClassification(props: FeatureProperties) {
  switch (selectedClassification.value) {
    case ClassificationData.CASES:
      return props.jumlah_kasus;
    case ClassificationData.CURRENTLY_TREATED:
      return props.jumlah_dirawat;
    case ClassificationData.RECOVERED:
      return props.jumlah_sembuh;
    case ClassificationData.DEAD:
      return props.jumlah_meninggal;
    case ClassificationData.MALE: {
      const count = props.jenis_kelamin.find((c) => c.key == JenisKelaminKey.LakiLaki);
      return count ? count.doc_count : 0;
    }
    case ClassificationData.FEMALE: {
      const count = props.jenis_kelamin.find((c) => c.key == JenisKelaminKey.Perempuan);
      return count ? count.doc_count : 0;
    }
    case ClassificationData.The05: {
      const count = props.kelompok_umur.find((c) => c.key == KelompokUmurKey.The05);
      return count ? count.doc_count : 0;
    }
    case ClassificationData.The618: {
      const count = props.kelompok_umur.find((c) => c.key == KelompokUmurKey.The618);
      return count ? count.doc_count : 0;
    }
    case ClassificationData.The1930: {
      const count = props.kelompok_umur.find((c) => c.key == KelompokUmurKey.The1930);
      return count ? count.doc_count : 0;
    }
    case ClassificationData.The3145: {
      const count = props.kelompok_umur.find((c) => c.key == KelompokUmurKey.The3145);
      return count ? count.doc_count : 0;
    }
    case ClassificationData.The4659: {
      const count = props.kelompok_umur.find((c) => c.key == KelompokUmurKey.The4659);
      return count ? count.doc_count : 0;
    }
    case ClassificationData.The60: {
      const count = props.kelompok_umur.find((c) => c.key == KelompokUmurKey.The60);
      return count ? count.doc_count : 0;
    }
    default:
      return props.jumlah_kasus;
  }
}

function getFeatureDomainBasedOnClassification(faetures: Feature[]) {
  switch (selectedClassification.value) {
    case ClassificationData.CASES:
      return faetures.map((c) => c.properties.jumlah_kasus);
    case ClassificationData.CURRENTLY_TREATED:
      return faetures.map((c) => c.properties.jumlah_dirawat);
    case ClassificationData.RECOVERED:
      return faetures.map((c) => c.properties.jumlah_sembuh);
    case ClassificationData.DEAD:
      return faetures.map((c) => c.properties.jumlah_meninggal);
    case ClassificationData.MALE:
      return faetures.map((c) => c.properties.jenis_kelamin[0].doc_count);
    case ClassificationData.FEMALE:
      return faetures.map((c) => c.properties.jenis_kelamin[1].doc_count);
    case ClassificationData.The05:
      return faetures.map((c) => c.properties.kelompok_umur[0].doc_count);
    case ClassificationData.The618:
      return faetures.map((c) => c.properties.kelompok_umur[1].doc_count);
    case ClassificationData.The1930:
      return faetures.map((c) => c.properties.kelompok_umur[2].doc_count);
    case ClassificationData.The3145:
      return faetures.map((c) => c.properties.kelompok_umur[3].doc_count);
    case ClassificationData.The4659:
      return faetures.map((c) => c.properties.kelompok_umur[4].doc_count);
    case ClassificationData.The60:
      return faetures.map((c) => c.properties.kelompok_umur[5].doc_count);
    default:
      return faetures.map((c) => c.properties.jumlah_kasus);
  }
}

async function countFacility(map: RawGeojson) {
  const [responseRs, responseLab] = await Promise.all([
    fetch("rs.json"),
    fetch("lab.json"),
  ]);

  const [rs, lab] = await Promise.all<[Promise<HospitalType[]>, Promise<LabType[]>]>([
    responseRs.json(),
    responseLab.json(),
  ]);

  map.features.map((currentMapValue) => {
    const data = {
      hospital_count: rs
        .map((c) => c.wilayah.split(", ")[1] == currentMapValue.properties.state)
        .reduce((p, c) => {
          return p + (c ? 1 : 0);
        }, 0),
      lab_count: lab
        .map((c) => c.provinsi == currentMapValue.properties.state)
        .reduce((p, c) => {
          return p + (c ? 1 : 0);
        }, 0),
    };
    currentMapValue.properties = Object.assign({}, currentMapValue.properties, data);
    return currentMapValue;
  });

  console.log(map.features[10].properties);
}

onMounted(async () => {
  await initMaps();
  changeClassification(ClassificationData.CASES);
});
</script>

<style lang="scss">
#map {
  height: 95vh;
}

.info {
  padding: 6px 8px;
  font: 14px/16px Arial, Helvetica, sans-serif;
  background: white;
  background: rgba(255, 255, 255, 0.8);
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.2);
  border-radius: 5px;
}

.legend {
  line-height: 18px;
  color: #555;
}
.legend i {
  width: 18px;
  height: 18px;
  float: left;
  margin-right: 8px;
  opacity: 0.7;
}
</style>
