from django import template
import re
import random

register = template.Library()

@register.filter
def lakh(value):
    try:
        return round(
            int(value) / 100000,
            2
        )
    except:
        return value

@register.filter
def safety(value):
    if value:
        return (
            f"{value} ★ Safety"
        )
    return (
        "Not tested yet"
    )

@register.filter
def power(engine_database):
    try:
        powers = []
        for engine in (
            engine_database.values()
        ):
            for gearbox in [
                "manual",
                "automatic",
                "amt",
                "automaticAWD"
            ]:
                if gearbox in engine:
                    power = (
                        engine[gearbox]
                        .get("power")
                    )
                    if power:
                        number = re.search(
                            r"\d+\.?\d*",
                            power
                        )
                        if number:
                            powers.append(
                                float(
                                    number.group()
                                )
                            )
        if not powers:
            return "N/A"
        return (
            f"{int(max(powers))} bhp"
        )
    except:
        return "N/A"

@register.filter
def mileage(engine_database):
    try:
        mileages = []
        for engine in (
            engine_database.values()
        ):
            for gearbox in [
                "manual",
                "automatic",
                "amt",
                "automaticAWD"
            ]:
                if gearbox in engine:
                    mileage = (
                        engine[gearbox]
                        .get(
                            "mileageARAI"
                        )
                    )
                    if mileage:
                        number = re.search(
                            r"\d+\.?\d*",
                            mileage
                        )
                        if number:
                            mileages.append(
                                float(
                                    number.group()
                                )
                            )
        if not mileages:
            return "N/A"
        return (
            f"{max(mileages):.1f} kmpl"
        )
    except:
        return "N/A"

@register.filter
def torque(engine_database):
    try:
        torques = []
        for engine in (
            engine_database.values()
        ):
            for gearbox in [
                "manual",
                "automatic",
                "amt",
                "automaticAWD"
            ]:
                if gearbox in engine:
                    torque = (
                        engine[gearbox]
                        .get("torque")
                    )
                    if torque:
                        number = re.search(
                            r"\d+\.?\d*",
                            torque
                        )
                        if number:
                            torques.append(
                                float(
                                    number.group()
                                )
                            )
        if not torques:
            return "N/A"
        return (
            f"{int(max(torques))} Nm"
        )
    except:
        return "N/A"

@register.filter
def random_usecases(usecases):
    try:
        if not usecases:
            return ""
        shuffled = (
            usecases.copy()
        )
        random.shuffle(
            shuffled
        )
        return (
            ", ".join(
                shuffled[:2]
            )
        )
    except:
        return ""


@register.filter
def carplay_type(variant):
    infotainment = variant.get("infotainment", {})
    wireless_android = infotainment.get("wirelessAndroidAuto", False)
    wireless_apple = infotainment.get("wirelessAppleCarPlay", False)
    wired_android = infotainment.get("androidAuto", False)
    wired_apple = infotainment.get("appleCarPlay", False)
    if wireless_android and wireless_apple:
        return "Wireless Android Auto & Apple CarPlay"
    if wireless_android:
        return "Wireless Android Auto"
    if wireless_apple:
        return "Wireless Apple CarPlay"
    if wired_android and wired_apple:
        return "Android Auto & Apple CarPlay"
    if wired_android:
        return "Android Auto"
    if wired_apple:
        return "Apple CarPlay"
    return "No Android Auto or Apple CarPlay"

@register.filter
def adas_type(variant):
    adas = variant.get("adas", {})
    if not adas.get("available", False):
        return "No ADAS"
    level = adas.get("level")
    if level:
        return f"Level {level} ADAS"
    return "ADAS"

@register.filter
def comfort_highlight(variant):
    comfort = variant.get("comfort", {})
    features = []
    if comfort.get("ventilatedFrontSeats"):
        features.append("Ventilated Seats")
    if comfort.get("wirelessCharging"):
        features.append("Wireless Charging")
        
    sunroof = comfort.get("sunroof")
    if isinstance(sunroof, dict):
        if sunroof.get("available"):
            features.append(sunroof.get("type", "Sunroof"))

    elif sunroof is True:
        features.append("Sunroof")
    
    if features:
        return ", ".join(features)
    return "Standard Comfort Features"

@register.filter
def random_comfort(variant):
    comfort = variant.get("comfort", {})
    try:
        if not comfort:
            return ""
        shuffled = (
            list(comfort.keys())
        )
        random.shuffle(
            shuffled
        )
        return (
            ", ".join(
                shuffled[:3]
            )
        )
    except:
        return ""

@register.filter
def safety_features(variant):
    safety = variant.get("safety", {})
    features = []
    if safety.get("abs"):
        features.append("ABS")
    if safety.get("ebd"):
        features.append("EBD")
    if safety.get("brakeAssist"):
        features.append("Brake Assist")
    if safety.get("esc"):
        features.append("ESC")
    if safety.get("tractionControl"):
        features.append("Traction Control")
    if safety.get("tpms"):
        features.append("TPMS")
    return ", ".join(features) if features else "Basic Safety Features"

@register.filter
def lookup(value, arg):
    if isinstance(value, dict):
        return value.get(arg)
    return None