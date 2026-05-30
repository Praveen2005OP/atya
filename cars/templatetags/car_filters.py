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