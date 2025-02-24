<template>
    <div>
        <h1>Generate Lineups</h1>
        <label>Number of Lineups: </label>
        <input type="number"
            v-model="numLineups"
            min="1"
            max="250"/>
        <br />
        <br />
        <!--
        <label>Minimum unique players per lineup: {{ minUniqueness }} </label>
        <br />
        <input type="range" 
            min="1" 
            max="5" 
            v-model="minUniqueness"/>
        <br />
        <label>Max exposure: {{ (maxExposure * 100).toFixed(0) }}% </label>
        <br />
        <input type="range" 
            min="0.05" 
            max="1"
            step="0.05"
            v-model="maxExposure"/>
        <br />
        -->
        
        <div style="display: flex; width: 100%;">
            <button class="action-button" @click="optimizeLineups">Optimize Lineups</button>
            <button v-if="lineupsGenerated" class="action-button" @click="exportClicked">Export</button>
        </div>
        
    </div>
</template>

<script setup>
import { ref, defineEmits } from 'vue';
import { generateSolutions } from '../lib/solver';

const numLineups = ref(10);
const minUniqueness = ref(1);
const maxExposure = ref(1);
const lineupsGenerated = ref(false);

const props = defineProps({
    playerData: {
        type: Array,
        default: []
    }
});

const emit = defineEmits(['updateLineups','gotoUploadPlayerData','exportLineups']);

const optimizeLineups = async () => {

    lineupsGenerated.value = false;
    emit('updateLineups', {loading:true, data:[]});

    if (props.playerData.length === 0) {
        alert('Missing player data - upload a DraftKings player pool CSV file.');
        emit('gotoUploadPlayerData');
        return;
    }

    try {        
        var res = await generateSolutions(
            numLineups.value,
            props.playerData,
            minUniqueness.value,
            maxExposure.value
        );
    } catch (error) {
        alert(`Error optimizing lineups: ${error}`);
    }

    lineupsGenerated.value = true;
    emit('updateLineups', {loading:false, data:res});
};

const exportClicked = () => {
    emit('exportLineups');
};

</script>


<style scoped>
.action-button {
    padding: 10px 20px;
    font-size: 16px;
    cursor: pointer;
    margin-bottom: 5px;
    margin-right: 5px;
}
</style>