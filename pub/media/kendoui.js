
$(function(){
  var lastIndex;
  $('#tt').datagrid({
    toolbar:[{
      text:'New',
      iconCls:'icon-add',
      handler: function(){
        $('#tt').datagrid('endEdit', lastIndex);
        $('#tt').datagrid('appendRow',{
          id: nextID(),
          name:'book title',
          author:'book\'s author',
        });
        lastIndex = $('#tt').datagrid('getRows').length-1;
        $('#tt').datagrid('selectRow', lastIndex);
        $('#tt').datagrid('beginEdit', lastIndex);
      }
    },
    '-',
    {
      text:'Delete',
      iconCls:'icon-remove',
      handler:function() {
        var rows = $('#tt').datagrid('getSelections');
        if (!rows.length) {
          alert('No rows selected');
          return;
        }
        var delids = [];
        for (i = 0; i < rows.length; i++) {
          delids.push(rows[i].id);
        }
        var yes = confirm('Delete ' + rows.length + ' rows?');
        if (yes) {
          $.ajax('/api/notes/' + delids.join(), {
            'type':'DELETE'
          });
          $('#tt').datagrid('reload');
        }
      }
    },
    '-',
    {
      text:'Save',
      iconCls:'icon-save',
      handler:function() {
        $('#tt').datagrid('endEdit', lastIndex);
        $.post("/api/notes/", {
          data: JSON.stringify($('#tt').datagrid('getChanges')),
        });
        $('#tt').datagrid('acceptChanges');
        $('#tt').datagrid('reload');
      }
    },
    '-',
    {
      text:'Cancel',
      iconCls:'icon-cancel',
      handler:function(){
        $('#tt').datagrid('rejectChanges');
      }
    },
    '-',
    {
      text:'None',
      iconCls:'icon-ok',
      handler:function(){
        $('#tt').datagrid('clearSelections');
      }
    },
    '-',
    {
      text:'All',
      iconCls:'icon-ok',
      handler:function(){
        $('#tt').datagrid('selectAll');
      }
    }],
    url: '/api/notes/',
    method: 'get',
    title: 'DataGrid Test',
    queryParams: { page:'' },
    pagination: true,
    rownumbers: true,
    idField: 'id',
    nowrap: true,
    autoRowHeight: false,
    striped: true,
    sortName: 'id',
    fitColumns:true,
    onBeforeLoad: function() { $(this).datagrid('rejectChanges'); },
    onDblClickRow: function(rowIndex){
      if (lastIndex != rowIndex){
        $('#tt').datagrid('endEdit', lastIndex);
        $('#tt').datagrid('beginEdit', rowIndex);
      }
      lastIndex = rowIndex;
    }
  });
});

function makeID() {
  var nextID = '';
  var az = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  var rows = $('#tt').datagrid('getRows');
  var i = rows.length;
  if (!i) return 'AA';
  var lastID = rows[i-1].id;
  if (lastID[1] == 'Z') {
    nextID += az[az.indexOf(lastID[0])+1];
  nextID += 'A';
  } else {
    nextID += lastID[0];
    nextID += az[az.indexOf(lastID[1])+1];
  }
  return nextID;
};

function nextID() {
  var rows = $('#tt').datagrid('getRows');
  var last_rowid = 0;
  if (rows.length)
    last_rowid = rows[rows.length - 1].id;
  last_rowid = parseInt(last_rowid);
  return (last_rowid + 1).toString();
};
