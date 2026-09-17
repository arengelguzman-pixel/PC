// Prompts en duro del servidor (la regla de fidelidad de PLATO VIVO).
// El dueño del restaurante no puede tocarlos: son el seguro del producto.

export const REGLA = `Re-photograph this dish as a professional food photograph for a restaurant menu.

THE FOOD AND ITS CONTAINER ARE SACRED — copy them exactly:
The exact same items, the exact same count, the exact same size, shape, position and
angle inside the frame. The same plate, bowl, basket or container holding them, in the same material and the
same shape: if it is disposable foam, plastic or paper, it stays disposable foam,
plastic or paper — never upgrade it to ceramic. Do not add,
remove, resize, duplicate or replace a single item of food. Do not add garnish, herbs,
seeds, sauce or decoration that is not already there. Do not change the recipe, the
colour of the food, or how cooked it looks. Do not re-frame, zoom or move the camera.
A customer who orders this must receive exactly what they see.

KEEP THE FRAMING LOCKED:
The plate must occupy exactly the same area of the frame as in the input, at the same
scale, in the same position, seen from the same camera height and angle. Do not pull the
camera back, do not zoom in, do not re-centre. Overlay the result on the input and the
plate must land on top of itself.

EVERYTHING ELSE IN THE FRAME IS CLUTTER — delete it:
Serving trays, plastic, packaging, juice cartons, drinks, sachets, wrappers, cutlery,
napkins, hands, fingers, furniture, chairs, other tables, floors, logos and text.
Replace all of it with a clean, calm, softly out-of-focus surface — warm natural wood
or matte neutral stone — with nothing else on it. The plate must sit alone.

TIDY THE PLATING — arrange, never invent:
You may reposition items that are ALREADY there so the plate reads clean and balanced,
the way a cook straightens a dish before it leaves the kitchen. You may wipe sauce
smears, drips and stray crumbs off the rim of the plate and off the container. You may
straighten a piece sitting crooked and tuck a loose garnish back into place.
This is arranging what exists. It is NEVER creating: you still may not add a single
piece, restore a bite that was taken, close a cut, refill a sauce, or make the portion
look bigger than it is.

RE-SHOOT IT PROPERLY:
Light it with a large soft diffused key from the upper left and a gentle fill, as in a
food studio. Neutral white balance, no orange or green cast. Deep, rich, natural colour.
A soft realistic contact shadow under the plate. Shallow depth of field so the background
falls away. Tack-sharp focus on the food with visible surface texture and crumb detail.

CLEAN IT UP COMPLETELY:
Remove ALL sensor noise, grain, colour speckle, motion blur, haze and JPEG compression
artifacts. The result must be clean and crisp, like a raw file from a full-frame camera
with a 50mm macro lens — not like a phone snapshot with a filter on top.

Output only the final photograph.

This is a retouch, not a filter. If the output still shows the original background,
the original noise, or the original phone-camera look, you have failed the task.
The only thing that survives from the input is the food and the plate it sits on.`;

export const REGLA_PLATO = `Re-photograph this dish as a professional food photograph for a restaurant menu.

THE FOOD AND ITS CONTAINER ARE SACRED — copy them exactly:
The exact same items, the exact same count, the exact same size, shape, position and
angle inside the frame. SERVE IT ON A PLATE: this food arrived in a disposable takeaway container (foam,
plastic, paper or cardboard). Move that exact same food, completely unchanged, onto a
plain simple white ceramic plate or bowl, arranged the way a cook would serve it at a
table. Plain white only: no slate board, no wooden platter, no rim pattern, no styling
props. The FOOD is untouched — the same pieces, the same count, the same portion, the
same sauces, the same amount of everything. Only the vessel changes. Do not add,
remove, resize, duplicate or replace a single item of food. Do not add garnish, herbs,
seeds, sauce or decoration that is not already there. Do not change the recipe, the
colour of the food, or how cooked it looks. Do not re-frame, zoom or move the camera.
A customer who orders this must receive exactly what they see.

KEEP THE FRAMING LOCKED:
The plate must occupy exactly the same area of the frame as in the input, at the same
scale, in the same position, seen from the same camera height and angle. Do not pull the
camera back, do not zoom in, do not re-centre. Overlay the result on the input and the
plate must land on top of itself.

EVERYTHING ELSE IN THE FRAME IS CLUTTER — delete it:
Serving trays, plastic, packaging, juice cartons, drinks, sachets, wrappers, cutlery,
napkins, hands, fingers, furniture, chairs, other tables, floors, logos and text.
Replace all of it with a clean, calm, softly out-of-focus surface — warm natural wood
or matte neutral stone — with nothing else on it. The plate must sit alone.

TIDY THE PLATING — arrange, never invent:
You may reposition items that are ALREADY there so the plate reads clean and balanced,
the way a cook straightens a dish before it leaves the kitchen. You may wipe sauce
smears, drips and stray crumbs off the rim of the plate and off the container. You may
straighten a piece sitting crooked and tuck a loose garnish back into place.
This is arranging what exists. It is NEVER creating: you still may not add a single
piece, restore a bite that was taken, close a cut, refill a sauce, or make the portion
look bigger than it is.

RE-SHOOT IT PROPERLY:
Light it with a large soft diffused key from the upper left and a gentle fill, as in a
food studio. Neutral white balance, no orange or green cast. Deep, rich, natural colour.
A soft realistic contact shadow under the plate. Shallow depth of field so the background
falls away. Tack-sharp focus on the food with visible surface texture and crumb detail.

CLEAN IT UP COMPLETELY:
Remove ALL sensor noise, grain, colour speckle, motion blur, haze and JPEG compression
artifacts. The result must be clean and crisp, like a raw file from a full-frame camera
with a 50mm macro lens — not like a phone snapshot with a filter on top.

Output only the final photograph.

This is a retouch, not a filter. If the output still shows the original background,
the original noise, or the original phone-camera look, you have failed the task.
The only thing that survives from the input is the food and the plate it sits on.`;

export const REVISION = `Look at this photograph of food. Answer ONLY with a JSON object, no other text:
{"empezado": true|false, "envase": true|false, "motivo": "<max 8 words, Spanish>"}

"empezado" = true ONLY if there is clear, unambiguous evidence that someone already
started eating: a visible bite taken out of an item, a piece cut open and partly gone,
food smeared across a plate mid-meal, a half-empty plate, or dirty used cutlery resting
in the food. Deliberate chef's plating, an artistic or abstract presentation, a
deconstructed dish, a sliced or halved item presented on purpose, a sauce swoosh, or a
dish that simply looks unusual are all NORMAL - those are false.
When in doubt, answer false.

"envase" = true if the food is served in a disposable takeaway container (foam, plastic,
paper, cardboard box). False for plates, bowls, baskets, pans, boards.`;
