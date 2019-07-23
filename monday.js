const _table = require("table");
const fs = require("fs");
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
    this.fetchBoard = function(boardId,filters) {
        this.axios.post("",{
            query : `{boards(ids:[${boardId}]){id name groups {id title} columns {id title type} items {id name group {id} column_values {id text}}}}`
        }).then(function(response){
            response["data"]["data"]["boards"].forEach(function(board){
                let group_tables = {};
                let group_column_ids = ['_id'];
                let group_column_names = ['_id'];
                board.columns.forEach(function(column){
                    group_column_ids.push(column.id);
                    group_column_names.push(column.title);
                });
                board.groups.forEach(function(group){
                    group_tables[group.id] = [group_column_names];
                });
                board.items.sort(function(a,b){
                    if(a.id > b.id) {
                        return -1;
                    } else if (a.id < b.id) {
                        return 1;
                    } else {
                        return 0;
                    }
                })
                board.items.forEach(function(item){
                    let row = [];
                    group_column_ids.forEach(function(column_id){
                        if(column_id === 'name') {
                            row.push(item.name);
                        } else if (column_id === '_id') {
		  	                    row.push(item.id);
		                    } else {
                            row.push(item.column_values.filter( column_value => column_value.id === column_id).map( column_value => column_value.text)[0]);
                        }
                    });
                    if(filters) {
                        if(filters.every(function(filter){
			                      return row.some(function(_val){
                    		        return _val.includes(filter)
		  	                    })
                        })) {
                            group_tables[item.group.id].push(row);
                        }
                    } else {
                        group_tables[item.group.id].push(row);
                    }
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
