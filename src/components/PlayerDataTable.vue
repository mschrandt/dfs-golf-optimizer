<template>
    <div>
      <EasyDataTable
        :table-height=500
        :rows-per-page=200
        :show-index="true"
        :fixed-header="true"
        :headers="headers"
        :items="items">

        <template #item-ExpectedFantasyPoints="item">

                <input
                    type="number"
                    v-model="item.ExpectedFantasyPoints"
                    @input="updatePlayerData(item)"
                />
        </template>

        <template #item-LockPlayer="item">
                <input
                    type="checkbox"
                    v-model="item.LockPlayer"
                    @change="updatePlayerData(item)"
                />
        </template>

        <template #item-EliminatePlayer="item">
                <input
                    type="checkbox"
                    v-model="item.EliminatePlayer"
                    @change="updatePlayerData(item)"
                />
        </template>

        <template #item-PlayerBoost="item">
            <div>
                <input
                    type="range"
                    min="-10"
                    max="10"
                    v-model="item.PlayerBoost"
                    @input="updatePlayerData(item)"
                    list="steplist"
                />
                <datalist id="steplist">
                    <option>-10</option>

                    <option>0</option>


                    <option>10</option>
                </datalist>
            </div>
        </template>

        <template #item-MaxExposure="item">
            <div style="display: flex; align-items: center;">
                <label style="margin-right: 10px; width: 20px;"> {{ (item.MaxExposure * 100).toFixed(0) }}% </label>
                <input
                    type="range"
                    min="0.05"
                    max="1"
                    step="0.05"
                    v-model="item.MaxExposure"
                    @input="updatePlayerData(item)"
                    list="exposureSteplist"
                />
                <datalist id="exposureSteplist">
                    <option>0.1</option>
                    <option>0.2</option>
                    <option>0.3</option>
                    <option>0.4</option>
                    <option>0.5</option>
                    <option>0.6</option>
                    <option>0.7</option>
                    <option>0.8</option>
                    <option>0.9</option>
                    <option>1</option>
                </datalist>
            </div>
        </template>

      </EasyDataTable>
    </div>
  </template>
  
<script setup>
import { ref, watch, defineEmits } from 'vue';
import EasyDataTable from 'vue3-easy-data-table';
import 'vue3-easy-data-table/dist/style.css';

const props = defineProps({
    data: {
        type: Array,
        required: true,
    },
});

const items = ref([]);

const headers = ref([
    { text: 'Name + ID', value: 'NameID', sortable: true },
    { text: 'Salary', value: 'Salary', sortable: true },
    { text: 'Game Info', value: 'GameInfo' },
    { text: 'Avg Points Per Game', value: 'AvgPointsPerGame', sortable: true },
    { text: 'Expected Fantasy Points', value: 'ExpectedFantasyPoints', sortable: true },
    { text: 'Lock Player', value: 'LockPlayer', sortable: true },
    { text: 'Eliminate Player', value: 'EliminatePlayer', sortable: true },
    { text: 'Boost Player', value: 'PlayerBoost', sortable: true },
    { text: 'Max Exposure', value: 'MaxExposure', sortable: true },
]);

const emit = defineEmits(['updatePlayerData']);

watch(() => props.data, (newData) => {
    items.value = newData.map(row => ({
        ...row,
        ExpectedFantasyPoints: row.AvgPointsPerGame,
        LockPlayer: false,
        EliminatePlayer: false,
        PlayerBoost: 0,
        MaxExposure: 0.8,
    }));

    emit('updatePlayerData', items.value);
}, { immediate: true });

const updatePlayerData = (item) => {
    const playerIndex = items.value.findIndex(i => i.ID === item.ID);
    items.value[playerIndex] = item;
    emit('updatePlayerData', items.value);
};
  
</script>
  
<style scoped>

</style>