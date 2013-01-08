$(function(){
  var lastIndex;
  var lastEdit = 0;
  var tbl = $('#tt');
  tbl.datagrid({
    url: '/api/notes/',
    method: 'get',
    title: 'DataGrid',
    pagination: true,
    pageNumber: 1,
    pageSize: 10,
    sortName: 'id',
    sortOrder: 'asc',
    remoteSort: true,
    rownumbers: true,
    idField: 'id',
    nowrap: true,
    autoRowHeight: false,
    striped: true,
    singleSelect:true,
    fitColumns:true,
    onBeforeLoad: function() { $(this).datagrid('rejectChanges'); },
    onDblClickRow: function(rowIndex){
      // update icon
      lb = $('#btn_upd').linkbutton();
      lb.data().linkbutton.options.iconCls = 'icon-edit';
      $('#btn_upd').linkbutton();
      if (lastIndex != rowIndex){
        $('#tt').datagrid('endEdit', lastIndex);
        $('#tt').datagrid('beginEdit', rowIndex);
      }
      lastIndex = rowIndex;
    }
  });
  $('#btn_add').click(function(){
    tbl.datagrid('endEdit', lastIndex);
    tbl.datagrid('appendRow',{
      name        : 'book title',
      author      : 'book\'s author',
      published   : '12-13-2000',
      category    : 'book category',
    });
    lastIndex = tbl.datagrid('getRows').length - 1;
    tbl.datagrid('selectRow', lastIndex);
    tbl.datagrid('beginEdit', lastIndex);
    // update icon
    lb = $('#btn_upd').linkbutton();
    lb.data().linkbutton.options.iconCls = 'icon-edit';
    $('#btn_upd').linkbutton();
  });
  $('#btn_upd').click(function(){
    tbl.datagrid('endEdit', lastIndex);
    // update icon
    lb = $('#btn_upd').linkbutton();
    lb.data().linkbutton.options.iconCls = 'icon-edit';
    $('#btn_upd').linkbutton();
    var row = tbl.datagrid('getSelected');
    if (row) {
      var this_index = tbl.datagrid('getRowIndex', row);
      if (this_index == lastIndex && !lastEdit) {
        tbl.datagrid('endEdit', this_index);
        lastEdit = 1;
        // update icon
        lb = $('#btn_upd').linkbutton();
        lb.data().linkbutton.options.iconCls = 'icon-ok';
        $('#btn_upd').linkbutton();
        return;
      }
      lastIndex = tbl.datagrid('getRowIndex', row);
      tbl.datagrid('beginEdit', lastIndex);
      lastEdit = 0;
      // update icon
      lb = $('#btn_upd').linkbutton();
      lb.data().linkbutton.options.iconCls = 'icon-edit';
      $('#btn_upd').linkbutton();
    }
  });
  $('#btn_del').click(function(){
    tbl.datagrid('endEdit', lastIndex);
    var row = tbl.datagrid('getSelected');
    if (row) {
      $.messager.confirm('Confirm','Are you sure you want to delete record?', function(r){
        if (r) {
          var n = tbl.datagrid('getRowIndex', row);
          tbl.datagrid('deleteRow', n);
        }
      });
    }
  });
  $('#btn_cancel').click(function(){
    $.messager.confirm('Confirm','Are you sure you want to discard changes?', function(r){
      if (r) {
        tbl.datagrid('rejectChanges');
      }
    });
  });
  $('#btn_save').click(function(){
    // update icon
    lb = $('#btn_upd').linkbutton();
    lb.data().linkbutton.options.iconCls = 'icon-ok';
    $('#btn_upd').linkbutton();
    var add_records = tbl.datagrid('getChanges', 'inserted');
    var upd_records = tbl.datagrid('getChanges', 'updated');
    var del_records = tbl.datagrid('getChanges', 'deleted');
    tbl.datagrid('acceptChanges');
    $.each(add_records, function(i, row) {
      $.ajax('/api/notes/', {
        'type':'POST',
        'data': {
          'name'       :row.name,
          'author'     :row.author,
          'published'  :row.published,
          'category'   :row.category,
        },
        success: function(response) {
          popup('Saved', 0);
        },
        error: function(response) {
          popup('err', true)
        }
      });
    });
    $.each(upd_records, function(i, row) {
      $.ajax('/api/notes/', {
        'type':'PUT',
        'data': {
          'id'         :row.id,
          'name'       :row.name,
          'author'     :row.author,
          'published'  :row.published,
          'category'   :row.category
        },
        success: function(response) {
          popup('Updated', 0);
        },
        error: function(response) {
          popup('err', true)
        }
      });
    });
    $.each(del_records, function(i, row) {
      $.ajax('/api/notes/' + row.id, {'type':'DELETE'});
    });
  });
});
function popup(text, err) {
  if (err) {
    $.messager.alert('Error!','Data transport error!','error');
  } else {
    $.messager.show({
      title:    'Success',
      msg:      text,
      timeout:  3000,
      showType: 'slide'
    });
  }
}
$(window).resize(function(){
  var height = $(window).height();
  $('#tt').datagrid('resize', { height: height-30 } )
});
