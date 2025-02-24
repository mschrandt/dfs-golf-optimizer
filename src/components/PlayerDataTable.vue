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
            <div style="display: flex; align-items: center; min-width: 200px">
                <label style="margin-left:10px; margin-right: 5px; min-width: 20px;"> {{ (item.MinExposure * 100).toFixed(0) }}% </label>

                <div style="flex-grow: 1">
                    <MultiRangeSlider
                        baseClassName="multi-range-slider-bar-only"
                        :min="0"
                        :max="1"
                        :step="0.05"
                        :ruler="true"
                        :label="true"
                        :minValue="item.MinExposure"
                        :maxValue="item.MaxExposure"
                        :preventWheel="true"
                        @input="updateExposure($event, item)"/>
                </div>
                
                <label style="margin-left: 5px;  min-width: 20px;"> {{ (item.MaxExposure * 100).toFixed(0) }}% </label>
            </div>
        </template>

        <template #item-GeneratedExposure="item">
            <div style="margin-left:10px">
                {{  getExposure(item.ID) }}
            </div>
        </template>

      </EasyDataTable>
    </div>
  </template>
  
<script setup>
import { ref, watch, defineEmits } from 'vue';
import EasyDataTable from 'vue3-easy-data-table';
import 'vue3-easy-data-table/dist/style.css';
import MultiRangeSlider from "multi-range-slider-vue";
import "multi-range-slider-vue/MultiRangeSliderBarOnly.css";

const props = defineProps({
    data: {
        type: Array,
        required: true,
    },
    generatedExposures: {
        type: Object,
        default: {}
    }
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
    { text: 'Boost Player', value: 'PlayerBoost' },
    { text: 'Exposure', value: 'MaxExposure' },
    { text: 'Generated Exposure', value: 'GeneratedExposure'},
]);

const emit = defineEmits(['updatePlayerData']);

const getExposure = (playerId) => {
    if (!props.generatedExposures || !props.generatedExposures[playerId]) return '-';

    return (props.generatedExposures[playerId] * 100).toFixed(0) + '%';
};

watch(() => props.data, (newData) => {
    items.value = newData.map(row => ({
        ...row,
        ExpectedFantasyPoints: row.AvgPointsPerGame,
        LockPlayer: false,
        EliminatePlayer: false,
        PlayerBoost: 0,
        MaxExposure: 0.8,
        MinExposure: 0,
    }));

    emit('updatePlayerData', items.value);
}, { immediate: true });

const updatePlayerData = (item) => {
    const playerIndex = items.value.findIndex(i => i.ID === item.ID);
    items.value[playerIndex] = item;
    emit('updatePlayerData', items.value);
};

const updateExposure = (event, item) => {
    item.MinExposure = event.minValue;
    item.MaxExposure = event.maxValue;
    updatePlayerData(item);
};
  
</script>
  
<style >
.multi-range-slider-bar-only{
    box-shadow: none;

    .bar-inner {
        background-color: rgb(2 117 255);
        box-shadow: none;
        border: none;
    }

    .thumb {
        align-content: center;

    }

    .thumb .caption * {
        display: none;
    }

    .thumb::before {
            background-color: rgb(2 117 255);
            box-shadow: none;
            border: none;
            width: 15px;
            height: 15px;
        }
    
    .bar-right, .bar-left {
        box-shadow: none;
        border: 1px solid #b2b2b2;
        background-color: #efefef;
    }
}
</style>