<template>
  <div class="percent-input">
    <input
      type="number"
      :value="formattedValue"
      @input="onInput"
      style="width: 50px;"
    />
    <span style="margin-left: 5px;">%</span>
  </div>
  </template>
  
  <script setup>
  import { computed } from 'vue';
  
  const props = defineProps({
    modelValue: {
      type: Number,
      required: true,
    },
  });
  
  const emit = defineEmits(['update:modelValue']);
  
  const formattedValue = computed({
    get() {
      return (props.modelValue * 100).toFixed(0);
    },
    set(value) {
      emit('update:modelValue', value / 100);
    },
  });
  
  const onInput = (event) => {
    formattedValue.value = event.target.value;
  };
  </script>

  <style scoped>
  .percent-input {
    display: flex;
    align-items: center;
  }
  </style>