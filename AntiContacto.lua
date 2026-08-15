--[[
    ================== ANTI-CONTACTO ==================
    Mini hub independiente. Botón flotante ON/OFF que, al activarse,
    hace que tu personaje se aleje automáticamente si otro jugador
    se acerca demasiado a ti.

    Este script es 100% independiente: no depende de ningún otro
    proyecto ni librería (Rayfield, etc). Solo pégalo y ejecútalo.
]]

-- ================== SERVICIOS ==================
local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local UserInputService = game:GetService("UserInputService")
local TweenService = game:GetService("TweenService")

local LocalPlayer = Players.LocalPlayer

-- ================== CONFIGURACIÓN ==================
local DISTANCIA_MINIMA = 8   -- studs: si alguien entra en este radio, te alejas
local DISTANCIA_HUIDA  = 6   -- studs: qué tan lejos te mueve cada vez

-- ================== ESTADO ==================
local Estado = {
    Activo = false,
}

local conexionAntiContacto = nil

-- ================== INTERFAZ FLOTANTE ==================
local hubGui = Instance.new("ScreenGui")
hubGui.Name = "AntiContactoHub"
hubGui.ResetOnSpawn = false
hubGui.IgnoreGuiInset = true
hubGui.Parent = (gethui and gethui()) or LocalPlayer:WaitForChild("PlayerGui")

local hubBoton = Instance.new("TextButton")
hubBoton.Name = "Toggle"
hubBoton.Size = UDim2.fromOffset(60, 60)
hubBoton.Position = UDim2.new(0.5, -30, 0.5, -30) -- centro de pantalla
hubBoton.BackgroundColor3 = Color3.fromRGB(35, 35, 35)
hubBoton.Text = "OFF"
hubBoton.TextColor3 = Color3.fromRGB(255, 255, 255)
hubBoton.TextSize = 13
hubBoton.Font = Enum.Font.GothamBold
hubBoton.AutoButtonColor = false
hubBoton.Active = true
hubBoton.Draggable = false -- el arrastre lo manejamos manualmente abajo
hubBoton.Parent = hubGui

local hubCorner = Instance.new("UICorner")
hubCorner.CornerRadius = UDim.new(1, 0) -- círculo perfecto
hubCorner.Parent = hubBoton

local hubStroke = Instance.new("UIStroke")
hubStroke.Color = Color3.fromRGB(80, 80, 80)
hubStroke.Thickness = 1.5
hubStroke.Parent = hubBoton

-- Botón pequeño de "ocultar/mostrar" (esquina del botón principal)
local hubOcultar = Instance.new("TextButton")
hubOcultar.Size = UDim2.fromOffset(20, 20)
hubOcultar.Position = UDim2.new(1, -8, 0, -8)
hubOcultar.BackgroundColor3 = Color3.fromRGB(20, 20, 20)
hubOcultar.Text = "-"
hubOcultar.TextColor3 = Color3.fromRGB(255, 255, 255)
hubOcultar.TextSize = 14
hubOcultar.Font = Enum.Font.GothamBold
hubOcultar.AutoButtonColor = false
hubOcultar.ZIndex = 2
hubOcultar.Parent = hubBoton

local hubOcultarCorner = Instance.new("UICorner")
hubOcultarCorner.CornerRadius = UDim.new(1, 0)
hubOcultarCorner.Parent = hubOcultar

-- ================== ARRASTRAR EL BOTÓN ==================
local arrastrando = false
local seMovio = false -- para diferenciar "click" de "arrastre" al soltar
local offsetArrastre = Vector2.new()

hubBoton.InputBegan:Connect(function(input)
    if input.UserInputType == Enum.UserInputType.MouseButton1 or input.UserInputType == Enum.UserInputType.Touch then
        arrastrando = true
        seMovio = false
        local posAbs = hubBoton.AbsolutePosition
        offsetArrastre = Vector2.new(input.Position.X - posAbs.X, input.Position.Y - posAbs.Y)
    end
end)

UserInputService.InputChanged:Connect(function(input)
    if arrastrando and (input.UserInputType == Enum.UserInputType.MouseMovement or input.UserInputType == Enum.UserInputType.Touch) then
        seMovio = true
        hubBoton.Position = UDim2.fromOffset(input.Position.X - offsetArrastre.X, input.Position.Y - offsetArrastre.Y)
    end
end)

UserInputService.InputEnded:Connect(function(input)
    if input.UserInputType == Enum.UserInputType.MouseButton1 or input.UserInputType == Enum.UserInputType.Touch then
        arrastrando = false
    end
end)

-- ================== LÓGICA: ALEJARSE DE JUGADORES CERCANOS ==================
local function startAntiContacto()
    if conexionAntiContacto then
        conexionAntiContacto:Disconnect()
    end

    conexionAntiContacto = RunService.Heartbeat:Connect(function()
        local char = LocalPlayer.Character
        local root = char and char:FindFirstChild("HumanoidRootPart")
        local humanoid = char and char:FindFirstChild("Humanoid")
        if not root or not humanoid then
            return
        end

        local amenaza = nil
        local distanciaMasCorta = DISTANCIA_MINIMA

        for _, jugador in ipairs(Players:GetPlayers()) do
            if jugador ~= LocalPlayer then
                local suChar = jugador.Character
                local suRoot = suChar and suChar:FindFirstChild("HumanoidRootPart")
                if suRoot then
                    local distancia = (suRoot.Position - root.Position).Magnitude
                    if distancia < distanciaMasCorta then
                        distanciaMasCorta = distancia
                        amenaza = suRoot
                    end
                end
            end
        end

        if amenaza then
            local direccion = root.Position - amenaza.Position
            direccion = Vector3.new(direccion.X, 0, direccion.Z)
            if direccion.Magnitude > 0 then
                humanoid:MoveTo(root.Position + direccion.Unit * DISTANCIA_HUIDA)
            end
        end
    end)
end

local function stopAntiContacto()
    if conexionAntiContacto then
        conexionAntiContacto:Disconnect()
        conexionAntiContacto = nil
    end
end

-- ================== BOTONES: ACTIVAR / OCULTAR ==================
hubBoton.MouseButton1Click:Connect(function()
    if seMovio then
        return -- fue un arrastre, no un click real
    end

    Estado.Activo = not Estado.Activo
    hubBoton.Text = Estado.Activo and "ON" or "OFF"
    hubBoton.BackgroundColor3 = Estado.Activo
        and Color3.fromRGB(23, 153, 110)
        or Color3.fromRGB(35, 35, 35)

    if Estado.Activo then
        startAntiContacto()
    else
        stopAntiContacto()
    end
end)

local oculto = false
hubOcultar.MouseButton1Click:Connect(function()
    oculto = not oculto
    TweenService:Create(hubBoton, TweenInfo.new(0.25), {
        Size = oculto and UDim2.fromOffset(18, 18) or UDim2.fromOffset(60, 60)
    }):Play()
    hubBoton.Text = oculto and "" or (Estado.Activo and "ON" or "OFF")
end)
