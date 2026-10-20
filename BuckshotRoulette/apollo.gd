extends SceneTree
func _initialize():
	DirAccess.make_dir_recursive_absolute(OS.get_user_data_dir())
	node_added.connect(_added)
	call_deferred("_start")
func _start():
	change_scene_to_file(ProjectSettings.get_setting("application/run/main_scene"))
func _added(node):
	_inspect.call_deferred(node)
func _inspect(node):
	if not is_instance_valid(node): return
	var content = str(node.name).to_lower()
	if node is Button or node is Label or node is RichTextLabel: content += " " + node.text.to_lower()
	var texture = null
	if node is TextureRect or node is Sprite2D: texture = node.texture
	if node is TextureButton: texture = node.texture_normal
	if texture != null: content += " " + texture.resource_path.to_lower()
	for term in ["port by", "ported by", "stratus", "truffled", "discord", "github", "website", "itch.io"]:
		if term in content and (node is CanvasItem):
			node.hide()
			node.process_mode = Node.PROCESS_MODE_DISABLED
			return
