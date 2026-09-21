from decimal import Decimal
from rest_framework import generics, permissions, status, viewsets
from rest_framework.response import Response
from .models import Budget, Category, Transaction, SavingsGoal, Debt, DebtHistory
from .serializers import BudgetSerializer, CategorySerializer, TransactionSerializer, SavingsGoalSerializer, DebtSerializer, DebtHistorySerializer
from rest_framework.permissions import IsAuthenticated

from rest_framework.decorators import action
from django.db import transaction
from django.core.cache import cache


# ViewSet for managing categories (expense, income, savings) for the authenticated user
class CategoryViewSet(viewsets.ModelViewSet):
    def perform_update(self, serializer):
        with transaction.atomic():
            serializer.save(user=self.request.user)
            # Invalidate cache when category updated
            cache.delete(f'user_categories_{self.request.user.id}')
            
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Cache categories for 10 minutes to reduce DB queries
        cache_key = f'user_categories_{self.request.user.id}'
        categories = cache.get(cache_key)
        
        if categories is None:
            categories = list(Category.objects.filter(user=self.request.user))
            cache.set(cache_key, categories, 600)  # 10 minutes
        
        # Return QuerySet for DRF compatibility
        if isinstance(categories, list):
            return Category.objects.filter(user=self.request.user)
        return categories

    def perform_create(self, serializer):
        with transaction.atomic():
            serializer.save(user=self.request.user)
            # Invalidate cache when new category created
            cache.delete(f'user_categories_{self.request.user.id}')

# Action to retrieve all expense,income and savings categories for the authenticated user
    @action(detail=False, methods=['get'])
    def expense_categories(self, request):
        qs = Category.objects.filter(user=request.user, transaction_type='expense')
        serializer = CategorySerializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def income_categories(self, request):
        qs = Category.objects.filter(user=request.user, transaction_type='income')
        serializer = CategorySerializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def savings_categories(self, request):
        qs = Category.objects.filter(user=request.user, transaction_type='savings')
        serializer = CategorySerializer(qs, many=True)
        return Response(serializer.data)


# ViewSet for managing budgets for the authenticated user
class BudgetViewSet(viewsets.ModelViewSet):
    def perform_update(self, serializer):
        with transaction.atomic():
            serializer.save(user=self.request.user)
    serializer_class = BudgetSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Budget.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        with transaction.atomic():
            serializer.save(user=self.request.user)


# ViewSet for managing transactions (expenses, incomes, savings) for the authenticated user
class TransactionViewSet(viewsets.ModelViewSet):
    def perform_update(self, serializer):
        with transaction.atomic():
            serializer.save(user=self.request.user)
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Use select_related to avoid N+1 queries
        return Transaction.objects.filter(user=self.request.user).select_related('category', 'user')

    def perform_create(self, serializer):
        with transaction.atomic():
            serializer.save(user=self.request.user)

# Actions to retrieve transactions by type (expenses, incomes, savings) with date filtering
    @action(detail=False, methods=['get'])
    def expenses(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        # get_queryset() already has select_related
        qs = self.get_queryset().filter(transaction_type='expense')
        if start_date and end_date:
            qs = qs.filter(date__range=[start_date, end_date])
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def incomes(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        # get_queryset() already has select_related
        qs = self.get_queryset().filter(transaction_type='income')
        if start_date and end_date:
            qs = qs.filter(date__range=[start_date, end_date])
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def savings(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        # get_queryset() already has select_related
        qs = self.get_queryset().filter(transaction_type='savings')
        if start_date and end_date:
            qs = qs.filter(date__range=[start_date, end_date])
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)


class SavingsGoalViewSet(viewsets.ModelViewSet):
    serializer_class = SavingsGoalSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return SavingsGoal.objects.filter(user=self.request.user).select_related('category')

    def perform_create(self, serializer):
        with transaction.atomic():
            serializer.save(user=self.request.user)

    def perform_update(self, serializer):
        with transaction.atomic():
            serializer.save(user=self.request.user)


class DebtViewSet(viewsets.ModelViewSet):
    serializer_class = DebtSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Debt.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        with transaction.atomic():
            debt = serializer.save(user=self.request.user)
            DebtHistory.objects.create(
                debt=debt,
                user=self.request.user,
                action='created',
                new_total_amount=debt.total_amount,
                new_paid_amount=debt.paid_amount,
                reason='Initial debt creation',
                notes=debt.notes or '',
            )

    def perform_update(self, serializer):
        with transaction.atomic():
            instance = self.get_object()
            old_total = instance.total_amount
            old_paid = instance.paid_amount

            # Extract reason if passed
            reason = serializer.validated_data.pop('reason', '').strip()

            debt = serializer.save(user=self.request.user)

            new_total = debt.total_amount
            new_paid = debt.paid_amount

            amount_changed = (old_total != new_total) or (old_paid != new_paid)

            if amount_changed:
                if old_paid != new_paid and old_total == new_total:
                    action = 'payment'
                    change_amount = new_paid - old_paid
                else:
                    action = 'amount_changed'
                    change_amount = new_total - old_total

                DebtHistory.objects.create(
                    debt=debt,
                    user=self.request.user,
                    action=action,
                    previous_total_amount=old_total,
                    new_total_amount=new_total,
                    previous_paid_amount=old_paid,
                    new_paid_amount=new_paid,
                    change_amount=change_amount,
                    reason=reason or 'Amount modified',
                    notes=debt.notes or '',
                )
            elif reason:
                DebtHistory.objects.create(
                    debt=debt,
                    user=self.request.user,
                    action='updated',
                    previous_total_amount=old_total,
                    new_total_amount=new_total,
                    previous_paid_amount=old_paid,
                    new_paid_amount=new_paid,
                    change_amount=Decimal('0.00'),
                    reason=reason,
                    notes=debt.notes or '',
                )

    @action(detail=True, methods=['get'])
    def history(self, request, pk=None):
        debt = self.get_object()
        histories = debt.history.all().order_by('-created_at')
        serializer = DebtHistorySerializer(histories, many=True)
        return Response(serializer.data)