<template>
    <div>
      <h1>Upload Player Data</h1>
      <input type="file" ref="fileInput" @change="handleFileUpload"  />
    </div>
  </template>
  
  <script>
  import { ref } from 'vue';
  import Papa from 'papaparse';
  
  export default {
    name: 'UploadPlayerData',
    setup(_, { emit }) {
      const fileInput = ref(null);
  
      const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (file && file.type === 'text/csv') {
          const reader = new FileReader();
          reader.onload = (e) => {
            const csvData = e.target.result;
            Papa.parse(csvData, {
              header: true,
              complete: (results) => {
                const filteredData = results.data.map(row => ({
                  Position: row.Position,
                  NameID: row['Name + ID'],
                  Name: row.Name,
                  ID: row.ID,
                  RosterPosition: row['Roster Position'],
                  Salary: row.Salary,
                  GameInfo: row['Game Info'],
                  TeamAbbrev: row.TeamAbbrev,
                  AvgPointsPerGame: row.AvgPointsPerGame,
                }));
                emit('file-uploaded', filteredData);
              },
            });
          };
          reader.readAsText(file);
        } else {
          alert('Please upload a valid CSV file.');
        }
      };
  
      return {
        fileInput,
        handleFileUpload,
      };
    },
  };
  </script>
  
  <style scoped>
  button {
    padding: 10px 20px;
    font-size: 16px;
    cursor: pointer;
  }
  </style>