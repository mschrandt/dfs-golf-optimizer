<script setup>
import { ref } from 'vue';
import UploadPlayerData from './components/UploadPlayerData.vue'
import PlayerDataTable from './components/PlayerDataTable.vue';
import OptimizeLineupsButton from './components/OptimizeLineupsButton.vue';
import GeneratedLineups from './components/GeneratedLineups.vue';
import { Tabs, Tab } from 'vue3-tabs-component';
import { calcExposure } from './lib/solver';

const playerData = ref([]);
const curatedPlayerData = ref([]);
const lineups = ref([]);
const tabs = ref(null);
const generatedExposures = ref({});

const handleFileUploaded = (data) => {
  playerData.value = data;
};

const updatedCuratedPlayerData = (data) => {
  curatedPlayerData.value = data;
}

const updateLineups = (newLineups) => {
  generatedExposures.value = calcExposure(newLineups, newLineups.length);
  lineups.value = newLineups.map(
    lineup => {

      const p1 = curatedPlayerData.value.find(player => player.ID === lineup.lineup[0]);
      const p2 = curatedPlayerData.value.find(player => player.ID === lineup.lineup[1]);
      const p3 = curatedPlayerData.value.find(player => player.ID === lineup.lineup[2]);
      const p4 = curatedPlayerData.value.find(player => player.ID === lineup.lineup[3]);
      const p5 = curatedPlayerData.value.find(player => player.ID === lineup.lineup[4]);
      const p6 = curatedPlayerData.value.find(player => player.ID === lineup.lineup[5]);

      return {
        Player1: { name: p1.NameID, exposure: generatedExposures.value[p1.ID] },
        Player2: { name: p2.NameID, exposure: generatedExposures.value[p2.ID] },
        Player3: { name: p3.NameID, exposure: generatedExposures.value[p3.ID] },
        Player4: { name: p4.NameID, exposure: generatedExposures.value[p4.ID] },
        Player5: { name: p5.NameID, exposure: generatedExposures.value[p5.ID] },
        Player6: { name: p6.NameID, exposure: generatedExposures.value[p6.ID] },
        totalSalary: parseInt(p1.Salary) + parseInt(p2.Salary) + parseInt(p3.Salary) + parseInt(p4.Salary) + parseInt(p5.Salary) + parseInt(p6.Salary),
        totalExpectedFantasyPoints: Math.round(parseFloat(p1.ExpectedFantasyPoints) + parseFloat(p2.ExpectedFantasyPoints) + parseFloat(p3.ExpectedFantasyPoints) + parseFloat(p4.ExpectedFantasyPoints) + parseFloat(p5.ExpectedFantasyPoints) + parseFloat(p6.ExpectedFantasyPoints)),
      };
    }
  ).sort((a, b) => b.totalExpectedFantasyPoints - a.totalExpectedFantasyPoints);
}

const gotoUploadPlayerData = () => {
  tabs.value.selectTab('#player-data-tab')
}

const exportLineups = () =>{
  
  const csvContent = "data:text/csv;charset=utf-8," + lineups.value.map(lineup => {
    return `${lineup.Player1.name},${lineup.Player2.name},${lineup.Player3.name},${lineup.Player4.name},${lineup.Player5.name},${lineup.Player6.name},${lineup.totalSalary},${lineup.totalExpectedFantasyPoints}`
  }).join('\n');

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "lineups.csv");
  document.body.appendChild(link); // Required for FF

  link.click();
}

</script>

<template>
  <div>
    <Tabs ref="tabs">
      <Tab id='player-data-tab' name="Upload Player Data" :selected="true">
        <UploadPlayerData class="upload-player-data" @file-uploaded="handleFileUploaded" />
        <PlayerDataTable 
          :data="playerData" 
          :generatedExposures="generatedExposures"
          @updatePlayerData="updatedCuratedPlayerData"/>
      </Tab>
      <Tab id='generate-lineups-tab' name="Generate Lineups">
        <OptimizeLineupsButton 
          :playerData="curatedPlayerData" 
          @updateLineups="updateLineups"
          @gotoUploadPlayerData="gotoUploadPlayerData" 
          @exportLineups="exportLineups"
          />
        <GeneratedLineups :lineups="lineups" />
      </Tab>
    </Tabs>
  </div>
</template>

<style scoped>
.upload-player-data{
  margin-bottom: 5px;
}
</style>
