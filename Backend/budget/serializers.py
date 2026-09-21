from decimal import Decimal

from rest_framework import serializers
from django.db.models import Sum
from .models import Budget, Category, Transaction
from .models import SavingsGoal
from .models import Debt, DebtHistory


# Serializer for the Category model
class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'transaction_type']

# Serializer for the Budget model
class BudgetSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(queryset=Category.objects.all(), source='category', write_only=True)

    class Meta:
        model = Budget
        fields = ['id', 'user', 'category', 'category_id', 'amount', 'period', 'start_date', 'created_at']
        read_only_fields = ['id', 'user', 'created_at', 'category']


# Serializer for the Transaction model
class TransactionSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = Transaction
        fields = ['id', 'user', 'category', 'category_name', 'amount', 'description', 'date', 'transaction_type', 'created_at']
        read_only_fields = ['id', 'user', 'created_at', 'category_name']


class SavingsGoalSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(queryset=Category.objects.all(), source='category', write_only=True)
    current_amount = serializers.SerializerMethodField()
    remaining_amount = serializers.SerializerMethodField()
    progress_percent = serializers.SerializerMethodField()

    class Meta:
        model = SavingsGoal
        fields = [
            'id',
            'user',
            'title',
            'category',
            'category_id',
            'target_amount',
            'current_amount',
            'remaining_amount',
            'progress_percent',
            'start_date',
            'target_date',
            'notes',
            'created_at',
        ]
        read_only_fields = [
            'id',
            'user',
            'created_at',
            'category',
            'current_amount',
            'remaining_amount',
            'progress_percent',
        ]

    def validate_category(self, value):
        request = self.context.get('request')
        if value.transaction_type != 'savings':
            raise serializers.ValidationError('Savings goals must use a savings category.')
        if request and value.user_id != request.user.id:
            raise serializers.ValidationError('Category does not belong to the current user.')
        return value

    def get_current_amount(self, obj):
        total = Transaction.objects.filter(
            user=obj.user,
            category=obj.category,
            transaction_type='savings',
            date__gte=obj.start_date,
        ).aggregate(total=Sum('amount'))['total']
        return total or Decimal('0.00')

    def get_remaining_amount(self, obj):
        current = self.get_current_amount(obj)
        remaining = obj.target_amount - current
        return remaining if remaining > 0 else Decimal('0.00')

    def get_progress_percent(self, obj):
        if not obj.target_amount:
            return Decimal('0.00')
        current = self.get_current_amount(obj)
        percent = (current / obj.target_amount) * Decimal('100')
        return percent if percent <= 100 else Decimal('100.00')


class DebtHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = DebtHistory
        fields = [
            'id',
            'debt',
            'user',
            'action',
            'previous_total_amount',
            'new_total_amount',
            'previous_paid_amount',
            'new_paid_amount',
            'change_amount',
            'reason',
            'notes',
            'created_at',
        ]
        read_only_fields = fields


class DebtSerializer(serializers.ModelSerializer):
    type = serializers.CharField(source='debt_type')
    reason = serializers.CharField(write_only=True, required=False, allow_blank=True)
    history_count = serializers.IntegerField(source='history.count', read_only=True)

    class Meta:
        model = Debt
        fields = [
            'id',
            'user',
            'title',
            'person',
            'type',
            'total_amount',
            'paid_amount',
            'due_date',
            'notes',
            'reason',
            'history_count',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at', 'history_count']

    def validate(self, attrs):
        total_amount = attrs.get('total_amount', getattr(self.instance, 'total_amount', None))
        paid_amount = attrs.get('paid_amount', getattr(self.instance, 'paid_amount', Decimal('0.00')))

        if total_amount is not None and total_amount <= 0:
            raise serializers.ValidationError({'total_amount': 'Total amount must be greater than 0.'})

        if paid_amount is not None and paid_amount < 0:
            raise serializers.ValidationError({'paid_amount': 'Paid amount cannot be negative.'})

        if total_amount is not None and paid_amount is not None and paid_amount > total_amount:
            raise serializers.ValidationError({'paid_amount': 'Paid amount cannot exceed total amount.'})

        # When updating existing debt, if total_amount or paid_amount changes, reason is mandatory
        if self.instance is not None:
            old_total = Decimal(str(self.instance.total_amount))
            old_paid = Decimal(str(self.instance.paid_amount))
            new_total = Decimal(str(total_amount)) if total_amount is not None else old_total
            new_paid = Decimal(str(paid_amount)) if paid_amount is not None else old_paid

            amount_changed = (new_total != old_total) or (new_paid != old_paid)
            reason = attrs.get('reason', '').strip()

            if amount_changed and not reason:
                raise serializers.ValidationError({'reason': 'A reason is mandatory when updating the total amount or paid amount.'})

        return attrs
