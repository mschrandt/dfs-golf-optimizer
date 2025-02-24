<template>
    <div>
        <EasyDataTable
            :table-height=500
            :rows-per-page=200
            :show-index="true"
            :fixed-header="true"
            :headers="columns"
            :items="lineups"
            :loading="loading"
        >
            <template #item-Player1.name="item">
                <div class="tooltip">
                        {{ item.Player1.name }}
                    <span class="tooltiptext">Exposure: {{ Math.round(item.Player1.exposure*100) }}%</span>
                </div>
            </template>
            <template #item-Player2.name="item">
                <div class="tooltip">
                        {{ item.Player2.name }}
                    <span class="tooltiptext">Exposure: {{ Math.round(item.Player2.exposure*100) }}%</span>
                </div>
            </template>
            <template #item-Player3.name="item">
                <div class="tooltip">
                        {{ item.Player3.name }}
                    <span class="tooltiptext">Exposure: {{ Math.round(item.Player3.exposure*100) }}%</span>
                </div>
            </template>
            <template #item-Player4.name="item">
                <div class="tooltip">
                        {{ item.Player4.name }}
                    <span class="tooltiptext">Exposure: {{ Math.round(item.Player4.exposure*100) }}%</span>
                </div>
            </template>
            <template #item-Player5.name="item">
                <div class="tooltip">
                        {{ item.Player5.name }}
                    <span class="tooltiptext">Exposure: {{ Math.round(item.Player5.exposure*100) }}%</span>
                </div>
            </template>
            <template #item-Player6.name="item">
                <div class="tooltip">
                        {{ item.Player6.name }}
                    <span class="tooltiptext">Exposure: {{ Math.round(item.Player6.exposure*100) }}%</span>
                </div>
            </template>
        </EasyDataTable>
    </div>
</template>

<script setup>
import { ref, defineProps } from 'vue';
import EasyDataTable from 'vue3-easy-data-table';
import 'vue3-easy-data-table/dist/style.css';

const props = defineProps({
    lineups: {
        type: Array,
        required: true,
    },
    loading: {
        type: Boolean,
        default: false,
    }
});

const columns = ref([
    { text: 'Player 1', value: 'Player1.name' },
    { text: 'Player 2', value: 'Player2.name' },
    { text: 'Player 3', value: 'Player3.name' },
    { text: 'Player 4', value: 'Player4.name' },
    { text: 'Player 5', value: 'Player5.name' },
    { text: 'Player 6', value: 'Player6.name' },
    { text: 'Total Salary', value: 'totalSalary' },
    { text: 'Total Expected Fantasy Points', value: 'totalExpectedFantasyPoints' },
]);
</script>