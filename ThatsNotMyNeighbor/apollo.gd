extends Node

var elapsed = 0.0

func _ready():
	get_tree().node_added.connect(_added)
	JavaScriptBridge.eval("window.__APOLLO_PORT_READY__=true")

func _process(delta):
	elapsed += delta
	if elapsed >= 0.5:
		elapsed = 0.0
		_scan(get_tree().root)

func _added(node):
	_inspect.call_deferred(node)

func _scan(node):
	_inspect(node)
	for child in node.get_children():
		_scan(child)

func _inspect(node):
	if not is_instance_valid(node) or not node is CanvasItem:
		return
	var content = str(node.name).to_lower()
	if node is Control:
		content += " " + node.tooltip_text.to_lower()
	if node is Button or node is Label or node is RichTextLabel:
		content += " " + node.text.to_lower()
	if node is LinkButton:
		content += " " + node.uri.to_lower()
	var texture = null
	if node is TextureRect or node is Sprite2D:
		texture = node.texture
	if node is TextureButton:
		texture = node.texture_normal
	if texture != null:
		content += " " + texture.resource_path.to_lower()
	for term in ["port by", "ported by", "port made by", "viet guy", "ricefarmer", "stratus", "truffled", "discord", "github", "website", "itch.io", "https://", "http://"]:
		if term in content:
			node.hide()
			node.process_mode = Node.PROCESS_MODE_DISABLED
			return
