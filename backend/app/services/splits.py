from decimal import Decimal, ROUND_HALF_UP

from app.models.expense import SplitType
from app.schemas.expense import SplitInput

CENT = Decimal("0.01")

def calculate_splits(split_type: SplitType, amount: Decimal, splits: list[SplitInput]) -> dict[int, Decimal]:
    if split_type == SplitType.EQUAL:
        return _calculate_equal(amount, [split.user_id for split in splits])
    if split_type == SplitType.EXACT:
        return _validate_exact(amount, splits)
    if split_type == SplitType.PERCENTAGE:
        return _calculate_percentage(amount, splits)
    raise ValueError(f"Unknown split type: {split_type}")

def _calculate_equal(amount: Decimal, user_ids: list[int]) -> dict[int, Decimal]:
    if not user_ids:
        raise ValueError("Must have at least 1 participant")
    
    base_share = (amount / len(user_ids)).quantize(CENT, rounding=ROUND_HALF_UP)
    shares = {user_id: base_share for user_id in user_ids}
    _distribute_remainder(shares, amount, user_ids)
    return shares


def _distribute_remainder(shares: dict[int, Decimal], amount: Decimal, order: list[int]) -> None:
    leftover_cents = int((amount - sum(shares.values())) / CENT)
    
    if leftover_cents > 0:
        step = CENT
    else:
        step = -CENT
    for i in range(abs(leftover_cents)):
        shares[order[i % len(order)]] += step
        
def _validate_exact(amount: Decimal, splits: list[SplitInput]) -> dict[int, Decimal]:
    shares: dict[int, Decimal] = {}
    
    for split in splits:
        if split.value is None:
            raise ValueError(f"Please input split amount for user {split.user_id}")
        shares[split.user_id] = split.value
        
    total = sum(shares.values())
    if total != amount:
        raise ValueError(f"Current split amounts ({total}) does not sum to the expense total ({amount})")
    
    return shares

def _calculate_percentage(amount: Decimal, splits: list[SplitInput]) -> dict[int, Decimal]:
    percentages: dict[int, Decimal] = {}
    
    for split in splits:
        if split.value is None:
            raise ValueError(f"Please input split percentage for user {split.user_id}")
        percentages[split.user_id] = split.value
        
    total_percentage = sum(percentages.values())
    if total_percentage != Decimal("100"):
        raise ValueError(f"Percentages must sum to 100 (Currently at {total_percentage}%)")
    
    shares = {}
    for user_id, percentage in percentages.items():
        shares[user_id] = (amount * percentage / Decimal("100")).quantize(CENT, rounding=ROUND_HALF_UP)
        
    _distribute_remainder(shares,amount, list(percentages.keys()))
    return shares