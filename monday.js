//import { table} from "table";
const _table = require("table");
const _axios = require("axios");
module.exports = function(_config) {
    if(_config === undefined || !_config.hasOwnProperty("monday_url") || !_config.hasOwnProperty("auth_token")) {
        throw "configuration doesn't have valid params: `monday_url` and `auth_token`";
    }

    if(typeof _config.monday_url !== 'string') {
        throw "invalid value type for `monday_url`";
    }

    if(typeof _config.auth_token !== 'string') {
        throw "invalid value type for `auth_token`";
    }

    this.axios = _axios.create({
        baseURL: `${_config.monday_url}/v2/`,
        headers: {
            "Authorization" : _config.auth_token
        }
    });
    this.fetchBoard = function(boardId) {
        this.axios.post("",{
            query : `{boards(ids:[${boardId}]){id name groups {id title} columns {id title type} items {name group {id} column_values {id text}}}}`
        }).then(function(response){
            response["data"]["data"]["boards"].forEach(function(board){
              let group_tables = {};
              let group_column_ids = [];
              let group_column_names = [];
              board.columns.forEach(function(column){
                group_column_ids.push(column.id);
                group_column_names.push(column.title);
              });
              board.groups.forEach(function(group){
                group_tables[group.id] = [group_column_names];
              });
              board.items.forEach(function(item){
                let row = [];
                group_column_ids.forEach(function(column_id){
                  if(column_id === 'name') {
                    row.push(item.name);
                  } else {
                    row.push(item.column_values.filter( column_value => column_value.id === column_id).map( column_value => column_value.text)[0]);
                  }
                });
                group_tables[item.group.id].push(row);
              });
              console.log(board.name);
              console.log('-----------------------')
              let options = {
                "columns": {
                }
              };
              group_column_ids.forEach(function(column_id,index){
                if(column_id === 'name') {
                  options.columns[index] = {
                    width: 40
                  }
                }
                if(column_id === 'person') {
                  options.columns[index] = {
                    width: 25
                  }
                }
                if(column_id === 'status') {
                  options.columns[index] = {
                    width: 20
                  }
                }
                if(column_id === 'dependency') {
                  options.columns[index] = {
                    width: 20
                  }
                }
                if(column_id === 'tags') {
                  options.columns[index] = {
                    width: 12
                  }
                }
              });
              board.groups.forEach(function(group){
                console.log(`${group.title}`);
                console.log(_table.table(group_tables[group.id],options));
              });
            });
            
        }).catch(function(error){
            console.log(error);
        });
    }
}
