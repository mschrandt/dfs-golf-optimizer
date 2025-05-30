<template>
    <div>
        <Modal 
            :show="showChangeAllMinExposuresModal" >
            <template #header>
                <h3>Change all min exposures</h3>
            </template>
            <template #body>
                <ChangeAllExposures 
                    :defaultValue="Math.min(...items.map(x=>x.MinExposure))"
                    @cancel="showChangeAllMinExposuresModal = false"
                    @ok="updateMinExposures($event)"/>
            </template>
        </Modal>

        <Modal 
            :show="showChangeAllMaxExposuresModal" >
            <template #header>
                <h3>Change all max exposures</h3>
            </template>
            <template #body>
                <ChangeAllExposures 
                    :defaultValue="Math.max(...items.map(x=>x.MaxExposure))"
                    @cancel="showChangeAllMaxExposuresModal = false"
                    @ok="updateMaxExposures($event)"/>
            </template>
        </Modal>


      <EasyDataTable
        :table-height=500
        :rows-per-page=200
        :show-index="true"
        :fixed-header="true"
        :headers="headers"
        :items="items">
        
        <template #header-EliminatePlayer="{ headers }">
            <div style="display: block; align-items: center;">
                <span class="mr-2">Eliminate Player</span>
                <button type="button" @click="toggleEliminateAll(!isAllPlayersLocked)">
                    {{ isAllPlayersLocked ? "Unselect All" : "Select All" }}
                </button>
            </div>
            
        </template>

        <template #header-MinExposure="{ headers }">
            <div style="display: block; align-items: center;">
                <span class="mr-2">Min Exposure</span>
                
                <button type="button" @click="showChangeAllMinExposuresModal = true">
                        Update All
                </button>
            </div>
        </template>


        <template #header-MaxExposure="{ headers }">
            <div style="display: block; align-items: center;">
                <span class="mr-2">Max Exposure</span>
                
                <button type="button" @click="showChangeAllMaxExposuresModal = true">
                        Update All
                </button>
            </div>
        </template>

        <template #item-ExpectedFantasyPoints="item">

                <input
                    type="number"
                    v-model="item.ExpectedFantasyPoints"
                    @input="updatePlayerData(item)"
                    style="width: 100%;"
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
                    min="-20"
                    max="20"
                    v-model="item.PlayerBoost"
                    @input="updatePlayerData(item)"
                    list="steplist"
                    style="width: 100%;"
                />
                <datalist id="steplist">
                    <option value="-20" label="-20"></option>
                    <option value="-10" ></option>
                    <option value="0" label="0"></option>
                    <option value="10" ></option>
                    <option value="20" label="20"></option>
                </datalist>
            </div>
        </template>

        <template #item-Exposure="item">
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

        <template #item-MinExposure="item">
            <PercentInput
                v-model="item.MinExposure"
                @input="updatePlayerData(item)"
            />
        </template>

        <template #item-MaxExposure="item">
            <PercentInput
                v-model="item.MaxExposure"
                @input="updatePlayerData(item)"
            />
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
import PercentInput from './columnFormats/PercentInput.vue';
import Modal from './modals/Modal.vue';
import ChangeAllExposures from './modals/ChangeAllExposures.vue';
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
const isAllPlayersLocked = ref(false);
const items = ref([]);
const showChangeAllMinExposuresModal=ref(false);
const showChangeAllMaxExposuresModal=ref(false);
const headers = ref([
    { text: 'Name + ID', value: 'NameID', sortable: true, fixed: true },
    { text: 'Salary', value: 'Salary', sortable: true },
    { text: 'Game Info', value: 'GameInfo' },
    { text: 'Avg Points Per Game', value: 'AvgPointsPerGame', sortable: true },
    { text: 'Expected Fantasy Points', value: 'ExpectedFantasyPoints', sortable: true },
    { text: 'Lock Player', value: 'LockPlayer', sortable: true },
    { text: 'Eliminate Player', value: 'EliminatePlayer', width: 120 },
    { text: 'Boost Player', value: 'PlayerBoost', width: 200},
    //{ text: 'Exposure', value: 'Exposure', },
    { text: 'Min Exposure', value: 'MinExposure' },
    { text: 'Max Exposure', value: 'MaxExposure' },
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
        ExpectedFantasyPoints: row.ExpectedFantasyPoints || row.AvgPointsPerGame,
        LockPlayer: row.LockPlayer || false,
        EliminatePlayer: row.EliminatePlayer || false,
        PlayerBoost: row.PlayerBoost || 0,
        MaxExposure: row.MaxExposure || 0.2,
        MinExposure: row.MinExposure || 0,
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

const updateMinExposures = ( { exposure, updateAllValues } ) => {
    console.log(exposure, updateAllValues)
    items.value.forEach((item) => 
        {
            if(updateAllValues === true || item.MinExposure < exposure){
                item.MinExposure = exposure;
                updatePlayerData(item);
            }
        });
    showChangeAllMinExposuresModal.value = false;
}

const updateMaxExposures = ({ exposure, updateAllValues } ) => {
    items.value.forEach((item) => 
        {
            if(updateAllValues === true || item.MinExposure > exposure){
                item.MaxExposure = exposure;
                updatePlayerData(item);
            }
        });

        showChangeAllMaxExposuresModal.value = false;
}

const toggleEliminateAll = (changeSelectionTo) => {
    isAllPlayersLocked.value = !isAllPlayersLocked.value;
    items.value.forEach((item) => item.EliminatePlayer = changeSelectionTo);

    emit('updatePlayerData', items.value);
}

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

datalist {
  display: flex;
  justify-content: space-between;
  width: 100%;
}

datalist option {
    text-align: center;
    flex: 1;
    position: relative;

}

.header {
    display:block;
}
</style>