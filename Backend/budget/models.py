from django.db import models
from django.contrib.auth import get_user_model

# Reference to the custom or default User model
User = get_user_model()


# Model representing a transaction category 
class Category(models.Model):
    # Types of categories
    CATEGORY_TYPES = [
        ('income', 'Income'),
        ('expense', 'Expense'),
        ('savings', 'Savings'),
    ]
    name = models.CharField(max_length=100)
    transaction_type = models.CharField(max_length=10, choices=CATEGORY_TYPES, default='expense')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='categories')
    is_default = models.BooleanField(default=False)

    def __str__(self):
        return self.name


# Model representing the budget for a specific category and period
class Budget(models.Model):
    PERIOD_CHOICES = [
        ('monthly', 'Monthly'),
        ('weekly', 'Weekly'),
        ('yearly', 'Yearly'),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='budgets')
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='budgets')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    period = models.CharField(max_length=10, choices=PERIOD_CHOICES, default='monthly')
    start_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        # String representation for admin and shell
        return f"{self.category.name} - {self.amount}"


# Model representing the financial transaction (income, expense, or savings)
class Transaction(models.Model):
    TRANSACTION_TYPES = [
        ('income', 'Income'),
        ('expense', 'Expense'),
        ('savings', 'Savings'),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='transactions', db_index=True)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='transactions', db_index=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    description = models.CharField(max_length=255)
    date = models.DateField(db_index=True)  # Add index for date filtering
    transaction_type = models.CharField(max_length=10, choices=TRANSACTION_TYPES, db_index=True)  # Add index
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['user', 'date'], name='user_date_idx'),  # Composite index for common queries
            models.Index(fields=['user', 'transaction_type'], name='user_type_idx'),
        ]
        ordering = ['-date']  # Default ordering by date descending

    def __str__(self):
        return f"{self.description} - {self.amount}"


class SavingsGoal(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='savings_goals')
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='savings_goals')
    title = models.CharField(max_length=120)
    target_amount = models.DecimalField(max_digits=12, decimal_places=2)
    start_date = models.DateField()
    target_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} - {self.target_amount}"


class Debt(models.Model):
    DEBT_TYPES = [
        ('i_owe', 'I Owe'),
        ('owed_to_me', 'Owed To Me'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='debts')
    title = models.CharField(max_length=150)
    person = models.CharField(max_length=150)
    debt_type = models.CharField(max_length=20, choices=DEBT_TYPES, default='i_owe')
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    paid_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    due_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f"{self.title} - {self.person}"


class DebtHistory(models.Model):
    debt = models.ForeignKey(Debt, on_delete=models.CASCADE, related_name='history')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='debt_histories')
    action = models.CharField(max_length=50, default='updated')
    previous_total_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    new_total_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    previous_paid_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    new_paid_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    change_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    reason = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.debt.title} - {self.action} ({self.created_at})"
