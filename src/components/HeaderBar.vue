<template>
  <nav class="navbar is-danger" role="navigation">
    <div class="navbar-brand">
      <a class="navbar-item" href="#">
        <img :src="garuda" class="mr-4" />
        <h1 class="is-capitalized is-size-2 title">
          <slot name="title">Peta Situasi Covid-19 Indonesia</slot>
        </h1>
      </a>

      <a
        role="button"
        class="navbar-burger"
        :class="isActive ? 'is-active' : ''"
        @click="isActive = !isActive"
      >
        <span></span>
        <span></span>
        <span></span>
      </a>
    </div>

    <div id="navbarBasicExample" class="navbar-menu" :class="isActive ? 'is-active' : ''">
      <div class="navbar-start"></div>

      <div class="navbar-end">
        <div class="navbar-item">
          <slot></slot>
        </div>
      </div>
    </div>
  </nav>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import garuda from "../assets/garuda.png";

const isActive = ref(false);
</script>

<style lang="scss">
.img-header {
  width: 16rem;
  height: 16rem;
}
</style>
