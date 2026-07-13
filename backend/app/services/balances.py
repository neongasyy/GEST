from decimal import Decimal

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.expense import Expense, ExpenseSplit


def calculate_net_balances(db: Session, group_id: int, member_ids: list[int]) -> dict[int, Decimal]:
    paid_rows = (
        db.query(Expense.paid_by, func.sum(Expense.amount))
        .filter(Expense.group_id == group_id)
        .group_by(Expense.paid_by)
        .all()
    )
    owed_rows = (
        db.query(ExpenseSplit.user_id, func.sum(ExpenseSplit.amount_owed))
        .join(Expense, Expense.id == ExpenseSplit.expense_id)
        .filter(Expense.group_id == group_id)
        .group_by(ExpenseSplit.user_id)
        .all()
    )

    paid = {user_id: total for user_id, total in paid_rows}
    owed = {user_id: total for user_id, total in owed_rows}

    net_balances = {}
    for user_id in member_ids:
        net_balances[user_id] = paid.get(user_id, Decimal("0")) - owed.get(user_id, Decimal("0"))

    return net_balances


def simplify_debts(net_balances: dict[int, Decimal]) -> list[tuple[int, int, Decimal]]:
    creditors = [[user_id, balance] for user_id, balance in net_balances.items() if balance > 0]
    creditors.sort(key=lambda entry: entry[1], reverse=True)

    debtors = [[user_id, -balance] for user_id, balance in net_balances.items() if balance < 0]
    debtors.sort(key=lambda entry: entry[1], reverse=True)

    transactions: list[tuple[int, int, Decimal]] = []

    i, j = 0, 0
    while i < len(debtors) and j < len(creditors):
        debtor_id, debt_amount = debtors[i]
        creditor_id, credit_amount = creditors[j]

        settle_amount = min(debt_amount, credit_amount)
        transactions.append((debtor_id, creditor_id, settle_amount))

        debtors[i][1] -= settle_amount
        creditors[j][1] -= settle_amount

        if debtors[i][1] == 0:
            i += 1
        if creditors[j][1] == 0:
            j += 1

    return transactions
