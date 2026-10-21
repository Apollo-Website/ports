extends "res://Steam.gd"

var _apollo_server_lobby_ids: Dictionary = {}

func _server_lobby_id(lobby_id_int: int) -> String:
	return _apollo_server_lobby_ids.get(lobby_id_int, super._server_lobby_id(lobby_id_int))

func _lobby_id_from_server(server_id: String) -> int:
	var lobby_id = super._lobby_id_from_server(server_id)
	_apollo_server_lobby_ids[lobby_id] = server_id
	return lobby_id
