// API endpoint para registro de usuarios
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  
  const { name, email, phone, address, password, type } = body
  
  // Validaciones básicas
  if (!name || !email || !phone || !address || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Todos los campos son requeridos'
    })
  }
  
  if (password.length < 6) {
    throw createError({
      statusCode: 400,
      statusMessage: 'La contraseña debe tener al menos 6 caracteres'
    })
  }
  
  // Simulación de creación de usuario
  const newUser = {
    id: Date.now(), // ID temporal
    name,
    email,
    phone,
    address,
    type: type || 'socio',
    createdAt: new Date().toISOString()
  }
  
  return {
    success: true,
    user: newUser,
    message: 'Usuario registrado exitosamente'
  }
})
