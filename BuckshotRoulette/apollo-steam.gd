extends "res://Steam.gd"

var _apollo_server_lobby_ids: Dictionary = {}
var _apollo_join_pending = false

func _ready() -> void:
	super._ready()
	get_tree().node_added.connect(_apollo_node_added)

func _apollo_node_added(node: Node) -> void:
	if node is Button and node.name == "button_join with lobby id":
		_apollo_bind_join.call_deferred(node)

func _apollo_bind_join(button: Button) -> void:
	if not is_instance_valid(button):
		return
	for connection in button.pressed.get_connections():
		var callback: Callable = connection["callable"]
		if callback.get_method() == "OnPress":
			button.pressed.disconnect(callback)
	button.pressed.connect(_apollo_open_join)

func _apollo_open_join() -> void:
	var result = JavaScriptBridge.eval("typeof window.__APOLLO_BUCKSHOT_JOIN__ === 'function' ? window.__APOLLO_BUCKSHOT_JOIN__() : window.prompt('Enter the 18-digit table ID:')", true)
	if result is String:
		_apollo_join(result)
	else:
		_apollo_join_pending = true

func _process(delta: float) -> void:
	super._process(delta)
	if _apollo_join_pending:
		var code = JavaScriptBridge.eval("window.__APOLLO_BUCKSHOT_CODE__ || ''")
		if code is String and code != "":
			_apollo_join_pending = false
			JavaScriptBridge.eval("window.__APOLLO_BUCKSHOT_CODE__=''")
			_apollo_join(code)

func _apollo_join(code: String) -> void:
	code = code.strip_edges().trim_prefix(APP_ID + "::")
	if code.length() != 18 or not code.is_valid_int() or code.begins_with("-") or code.begins_with("+"):
		return
	var manager = get_node_or_null("/root/mp_lobby/standalone managers/lobby manager")
	if manager != null:
		manager.join_lobby(int(code))

func _server_lobby_id(lobby_id_int: int) -> String:
	return _apollo_server_lobby_ids.get(lobby_id_int, super._server_lobby_id(lobby_id_int))

func _lobby_id_from_server(server_id: String) -> int:
	var lobby_id = super._lobby_id_from_server(server_id)
	_apollo_server_lobby_ids[lobby_id] = server_id
	return lobby_id
