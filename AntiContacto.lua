--[[
    ================== ANTI-CONTACTO ==================
    Mini hub independiente. Tarjeta cuadrada con título y switch ON/OFF.
    Al activarse, si un jugador se acerca demasiado, tu personaje
    esquiva con un teletransporte instantáneo en dirección contraria.

    100% independiente: no depende de ningún otro proyecto ni librería.
    
]]

-- ================== SERVICIOS ==================
local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local UserInputService = game:GetService("UserInputService")
local TweenService = game:GetService("TweenService")

local LocalPlayer = Players.LocalPlayer

-- ================== CONFIGURACIÓN ==================
local DISTANCIA_MINIMA   = 14    -- studs: si alguien entra en este radio, esquivas
local DISTANCIA_ESQUIVE  = 11    -- studs: qué tan lejos te teletransporta cada esquive
local COOLDOWN_ESQUIVE   = 0.5  -- segundos entre cada esquive (evita temblor)

-- ================== ESTADO ==================
local Estado = {
    Activo = false,
}

local conexionAntiContacto = nil
local ultimoEsquive = 0

-- ================== INTERFAZ ==================
local hubGui = Instance.new("ScreenGui")
hubGui.Name = "AntiContactoHub"
hubGui.ResetOnSpawn = false
hubGui.IgnoreGuiInset = true
hubGui.Parent = (gethui and gethui()) or LocalPlayer:WaitForChild("PlayerGui")

-- Tarjeta principal (cuadrada, esquinas redondeadas, estilo oscuro profesional)
local card = Instance.new("Frame")
card.Name = "Card"
card.Size = UDim2.fromOffset(150, 90)
card.Position = UDim2.new(0.5, -75, 0.5, -45) -- centro de pantalla
card.BackgroundColor3 = Color3.fromRGB(24, 24, 24)
card.BorderSizePixel = 0
card.Active = true
card.Parent = hubGui

local cardCorner = Instance.new("UICorner")
cardCorner.CornerRadius = UDim.new(0, 16)
cardCorner.Parent = card

local cardStroke = Instance.new("UIStroke")
cardStroke.Color = Color3.fromRGB(45, 45, 45)
cardStroke.Thickness = 1
cardStroke.Parent = card

-- Barra superior: título + botón de ocultar
local barra = Instance.new("Frame")
barra.Size = UDim2.new(1, 0, 0, 26)
barra.BackgroundTransparency = 1
barra.Parent = card

local titulo = Instance.new("TextLabel")
titulo.Text = "Anti-Contacto"
titulo.Size = UDim2.new(1, -30, 1, 0)
titulo.Position = UDim2.new(0, 12, 0, 0)
titulo.BackgroundTransparency = 1
titulo.TextColor3 = Color3.fromRGB(235, 235, 235)
titulo.TextSize = 13
titulo.Font = Enum.Font.GothamBold
titulo.TextXAlignment = Enum.TextXAlignment.Left
titulo.Parent = barra

local hubOcultar = Instance.new("TextButton")
hubOcultar.Size = UDim2.fromOffset(20, 20)
hubOcultar.Position = UDim2.new(1, -26, 0, 3)
hubOcultar.BackgroundColor3 = Color3.fromRGB(40, 40, 40)
hubOcultar.Text = "-"
hubOcultar.TextColor3 = Color3.fromRGB(255, 255, 255)
hubOcultar.TextSize = 14
hubOcultar.Font = Enum.Font.GothamBold
hubOcultar.AutoButtonColor = false
hubOcultar.Parent = barra

local hubOcultarCorner = Instance.new("UICorner")
hubOcultarCorner.CornerRadius = UDim.new(1, 0)
hubOcultarCorner.Parent = hubOcultar

-- Línea separadora sutil
local linea = Instance.new("Frame")
linea.Size = UDim2.new(1, -24, 0, 1)
linea.Position = UDim2.new(0, 12, 0, 26)
linea.BackgroundColor3 = Color3.fromRGB(45, 45, 45)
linea.BorderSizePixel = 0
linea.Parent = card

-- Fila del switch: etiqueta "Activar" + interruptor real
local filaSwitch = Instance.new("Frame")
filaSwitch.Size = UDim2.new(1, -24, 0, 30)
filaSwitch.Position = UDim2.new(0, 12, 0, 40)
filaSwitch.BackgroundTransparency = 1
filaSwitch.Parent = card

local etiquetaSwitch = Instance.new("TextLabel")
etiquetaSwitch.Text = "Activar"
etiquetaSwitch.Size = UDim2.new(0.6, 0, 1, 0)
etiquetaSwitch.BackgroundTransparency = 1
etiquetaSwitch.TextColor3 = Color3.fromRGB(200, 200, 200)
etiquetaSwitch.TextSize = 14
etiquetaSwitch.Font = Enum.Font.Gotham
etiquetaSwitch.TextXAlignment = Enum.TextXAlignment.Left
etiquetaSwitch.Parent = filaSwitch

-- Switch (track + knob), estilo interruptor real
local switchTrack = Instance.new("TextButton")
switchTrack.Text = ""
switchTrack.Size = UDim2.fromOffset(40, 22)
switchTrack.Position = UDim2.new(1, -40, 0.5, -11)
switchTrack.AnchorPoint = Vector2.new(0, 0)
switchTrack.BackgroundColor3 = Color3.fromRGB(50, 50, 50)
switchTrack.AutoButtonColor = false
switchTrack.Parent = filaSwitch

local switchTrackCorner = Instance.new("UICorner")
switchTrackCorner.CornerRadius = UDim.new(1, 0)
switchTrackCorner.Parent = switchTrack

local switchKnob = Instance.new("Frame")
switchKnob.Size = UDim2.fromOffset(18, 18)
switchKnob.Position = UDim2.fromOffset(2, 2)
switchKnob.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
switchKnob.Parent = switchTrack

local switchKnobCorner = Instance.new("UICorner")
switchKnobCorner.CornerRadius = UDim.new(1, 0)
switchKnobCorner.Parent = switchKnob

local COLOR_ON = Color3.fromRGB(23, 153, 110)
local COLOR_OFF = Color3.fromRGB(50, 50, 50)

local function actualizarSwitch(activo, animar)
    local infoTween = TweenInfo.new(0.2, Enum.EasingStyle.Quad, Enum.EasingDirection.Out)
    local posKnob = activo and UDim2.fromOffset(20, 2) or UDim2.fromOffset(2, 2)
    local colorTrack = activo and COLOR_ON or COLOR_OFF

    if animar then
        TweenService:Create(switchKnob, infoTween, { Position = posKnob }):Play()
        TweenService:Create(switchTrack, infoTween, { BackgroundColor3 = colorTrack }):Play()
    else
        switchKnob.Position = posKnob
        switchTrack.BackgroundColor3 = colorTrack
    end
end

-- ================== ARRASTRAR LA TARJETA (por la barra superior) ==================
local arrastrando = false
local offsetArrastre = Vector2.new()

barra.InputBegan:Connect(function(input)
    if input.UserInputType == Enum.UserInputType.MouseButton1 or input.UserInputType == Enum.UserInputType.Touch then
        arrastrando = true
        local posAbs = card.AbsolutePosition
        offsetArrastre = Vector2.new(input.Position.X - posAbs.X, input.Position.Y - posAbs.Y)
    end
end)

UserInputService.InputChanged:Connect(function(input)
    if arrastrando and (input.UserInputType == Enum.UserInputType.MouseMovement or input.UserInputType == Enum.UserInputType.Touch) then
        card.Position = UDim2.fromOffset(input.Position.X - offsetArrastre.X, input.Position.Y - offsetArrastre.Y)
    end
end)

UserInputService.InputEnded:Connect(function(input)
    if input.UserInputType == Enum.UserInputType.MouseButton1 or input.UserInputType == Enum.UserInputType.Touch then
        arrastrando = false
    end
end)

-- ================== LÓGICA: ESQUIVE POR TELETRANSPORTE ==================
local function startAntiContacto()
    if conexionAntiContacto then
        conexionAntiContacto:Disconnect()
    end

    conexionAntiContacto = RunService.Heartbeat:Connect(function()
        if tick() - ultimoEsquive < COOLDOWN_ESQUIVE then
            return -- todavía en cooldown, no esquives de nuevo
        end

        local char = LocalPlayer.Character
        local root = char and char:FindFirstChild("HumanoidRootPart")
        if not root then
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
                local destino = root.Position + direccion.Unit * DISTANCIA_ESQUIVE
                -- Teletransporte instantáneo (esquive), mantiene tu altura actual
                root.CFrame = CFrame.new(Vector3.new(destino.X, root.Position.Y, destino.Z)) * (root.CFrame - root.CFrame.Position)
                ultimoEsquive = tick()
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

-- ================== ACTIVAR / DESACTIVAR ==================
switchTrack.MouseButton1Click:Connect(function()
    Estado.Activo = not Estado.Activo
    actualizarSwitch(Estado.Activo, true)

    if Estado.Activo then
        startAntiContacto()
    else
        stopAntiContacto()
    end
end)

-- ================== OCULTAR / MOSTRAR TARJETA ==================
local oculto = false
local tamanoCompleto = card.Size

hubOcultar.MouseButton1Click:Connect(function()
    oculto = not oculto
    TweenService:Create(card, TweenInfo.new(0.25), {
        Size = oculto and UDim2.fromOffset(150, 26) or tamanoCompleto
    }):Play()
    linea.Visible = not oculto
    filaSwitch.Visible = not oculto
    hubOcultar.Text = oculto and "+" or "-"
end)

-- Estado inicial visual del switch
actualizarSwitch(Estado.Activo, false)
