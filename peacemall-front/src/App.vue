<template>
  <router-view />
</template>

<script>
export default {
  name: 'App'
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Arial', 'Microsoft YaHei', sans-serif;
  background-color: #f8f9fe;
  color: #333;
}

#app {
  width: 100%;
  height: 100%;
}

a {
  text-decoration: none;
}

button {
  cursor: pointer;
}
</style>
