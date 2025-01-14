from flask import Flask, render_template, request, redirect, url_for

app = Flask(__name__)

# Ruta para la pantalla inicial
@app.route("/", methods=["GET", "POST"])
def index():
    if request.method == "POST":
        # Recibimos la notación ABC del formulario
        abc_notation = request.form.get("abc")
        
        # Guardamos la notación en una variable global (o podríamos usar una sesión para manejarlo)
        global current_abc
        current_abc = abc_notation
        
        # Redirigimos al chat con la partitura cargada
        return redirect(url_for("chat"))
    
    return render_template("index.html")

# Ruta para la pantalla de chat
@app.route("/chat", methods=["GET", "POST"])
def chat():
    global current_abc  # Aseguramos acceso a la variable con la notación ABC
    
    if request.method == "POST":
        # Aquí podrías manejar interacciones de chat adicionales
        user_input = request.form.get("user_input")
        response = f"Procesando tu mensaje: {user_input}"
        return render_template("chat.html", abc=current_abc, response=response)
    
    # Renderizamos la pantalla de chat con la partitura generada
    return render_template("chat.html", abc=current_abc, response=None)

if __name__ == "__main__":
    app.run(debug=True)
