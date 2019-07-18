const axios = require("axios");
module.exports = function(_config) {
  if(_config === undefined || !_config.hasOwnProperty('monday_url') || !_config.hasOwnProperty('api_key')) {
    throw "configuration doesn't have valid params : `monday_url` and `api_key`";
  }

  if(typeof _config.monday_url === 'string') {
    throw "invalid value type for `monday_url`";
  }

  if(typeof _config.api_key === 'string') {
    throw "invalid value type for `api_key`";
  }

  this.config = _config;

  this.clusterPulsesByGroup = function(pulses) {
    let pulsesByGroup = {};
    pulses.forEach(function(pulse) {
      if (pulse.board_meta && pulse.board_meta.group_id) {
        if (!pulsesByGroup[pulse.board_meta.group_id]) {
          pulsesByGroup[pulse.board_meta.group_id] = [];
        }
        pulsesByGroup[pulse.board_meta.group_id].push(pulse);
      }
    });
    return pulsesByGroup;
  };
  
  this.resolveColumnValue = function(column, value) {
    if (column.type === "name" && value) {
      return value.name;
    } else if (column.type === "person" && value && value.value) {
      return value.value.name;
    } else if (column.type === "color" && value && value.value) {
      return column.labels[value.value.index];
    } else if (column.type === "date" && value) {
      return value.value;
    } else {
      return "";
    }
  };
  
  this.pulseToColumnValues = function(columns, pulse) {
    return pulse.column_values.reduce(function(pulseValues, columnValue) {
      pulseValues[columnValue.cid] = resolveColumnValue(
        columns[columnValue.cid],
        columnValue
      );
      return pulseValues;
    }, {});
  };
  
  this.transformColumnListToMap = function(columns) {
    return columns.reduce(function(columnMap, column) {
      columnMap[column.id] = column;
      return columnMap;
    }, {});
  };
  
  this.printBoard = function(board, pulses) {
    let pulsesByGroup = clusterPulsesByGroup(pulses);
    let columns = transformColumnListToMap(board.columns);
    let columnKeys = Object.keys(columns);
    console.log(board.name);
    console.log("===================");
    let heading = columnKeys.reduce(function(line, key) {
      return line + columns[key].title + "|";
    }, "|");
    let headingSeperator = columnKeys.reduce(function(line, key) {
          return line + "-" + "|";
    }, "|");
    Object.keys(pulsesByGroup).forEach(function(key) {
      console.log(`==${key}==`);
      console.log(headingSeperator);
      console.log(heading);
      console.log(headingSeperator);
      pulsesByGroup[key].forEach(function(pulse) {
        let pulseValue = pulseToColumnValues(columns, pulse);
        console.log(
          columnKeys.reduce(function(line, key) {
            return line + pulseValue[key] + "|";
          }, "|")
        );
      });
    });
  };
  
  this.fetchBoardPulses = function(board, pageNo, pulses, func) {
    axios({
      method: "GET",
      url: `${this.config.monday_url}/v1/boards/${
        board.id
      }/pulses.json?per_page=25&page=${pageNo}&api_key=${this.config.api_key}`
    }).then(function(response) {
      pulses = pulses.concat(response.data);
      if (response["data"].length < 25) {
        func(board, pulses);
      } else {
        fetchBoardPulses(board, pageNo + 1, pulses, func);
      }
    });
  };
  
  this.fetchBoard = function(boardId, func) {
    axios({
      method: "GET",
      url: `${this.config.monday_url}/v1/boards/${boardId}.json?api_key=${
        config.api_key
      }`
    }).then(function(response) {
      fetchBoardPulses(response.data, 1, [], func);
    });
  };

  this.fetchAndPrintBoard = function(boardId) {
    this.fetchBoard(boardId,this.printBoard);
  }
  
  this.listBoards = function() {
    axios({
      method: "GET",
      url: `${this.config.monday_url}/v1/boards.json?per_page=${100}&api_key=${
        config.api_key
      }`
    }).then(function(response) {
      response.data.forEach(function(board){
        console.log(`${board.id} : ${board.name}`);
      })
    });
  }

}
