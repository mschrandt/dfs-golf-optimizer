<template>
    <div>
        <EasyDataTable
            :table-height=500
            :rows-per-page=200
            :show-index="true"
            :fixed-header="true"
            :headers="columns"
            :items="lineups"
        />
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
});

const columns = ref([
    { text: 'Player 1', value: 'Player1' },
    { text: 'Player 2', value: 'Player2' },
    { text: 'Player 3', value: 'Player3' },
    { text: 'Player 4', value: 'Player4' },
    { text: 'Player 5', value: 'Player5' },
    { text: 'Player 6', value: 'Player6' },
    { text: 'Total Salary', value: 'totalSalary' },
    { text: 'Total Expected Fantasy Points', value: 'totalExpectedFantasyPoints' },
]);
</script>