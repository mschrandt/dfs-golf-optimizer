<template>
  <div class="exposure-popup">
    <div class="exposure-input-container">
        <label>Exposure:</label>
        <PercentInput v-model="exposure" />
    </div>

    <div class="exposure-input-container">
        <label for="update-all">Override all values</label>
        <input type="checkbox" id="update-all" v-model="updateAllValues" />
    </div>

    <div class="footer">
      <button class="action-button" @click="okClicked">OK</button>
      <button class="action-button" @click="cancelClicked">Cancel</button>
    </div>
  </div>
</template>

<script setup>
import { ref, defineEmits, watch, watchEffect } from 'vue';
import PercentInput from '@/components/columnFormats/PercentInput.vue';

const props = defineProps({
  defaultValue: {
    type: Number,
    default: 0
  }
});
const exposure = ref(0);
const updateAllValues = ref(true);

const emit = defineEmits(['ok', 'cancel']);

watchEffect(() => {
  exposure.value = props.defaultValue;
});

const okClicked = () => {
  emit('ok', { exposure: exposure.value,updateAllValues: updateAllValues.value });
};

const cancelClicked = () => {
  emit('cancel');
};
</script>

<style scoped>
.exposure-input-container {
    display: flex;

    * {
        margin-right: 10px;
    }
}

.footer {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
    * {
        margin-left: 10px;
    }
}
</style>