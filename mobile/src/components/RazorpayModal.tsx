import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { PaymentOrder } from '../types/api';
import { Button } from './Button';

interface RazorpayModalProps {
  visible: boolean;
  order: PaymentOrder | null;
  onSuccess: (paymentData: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
  onFailure: (error: string) => void;
  onCancel: () => void;
}

export const RazorpayModal: React.FC<RazorpayModalProps> = ({
  visible,
  order,
  onSuccess,
  onFailure,
  onCancel,
}) => {
  const { colors } = useTheme();
  const [processing, setProcessing] = useState(false);

  if (!order || !visible) return null;

  const formattedAmount = (order.amount_paise / 100).toLocaleString('en-IN', {
    style: 'currency',
    currency: order.currency || 'INR',
  });

  const handleSimulateSuccess = () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      const fakePaymentId = `pay_sim_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const fakeSignature = `sig_sim_${Date.now()}`;
      onSuccess({
        razorpay_payment_id: fakePaymentId,
        razorpay_order_id: order.razorpay_order_id,
        razorpay_signature: fakeSignature,
      });
    }, 1200);
  };

  const handleSimulateFailure = () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      onFailure('Payment failed: Insufficient funds or card declined by issuing bank.');
    }, 1000);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.modalContainer, { backgroundColor: colors.surface }]}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.brandText, { color: colors.primary }]}>Sahyātri Checkout</Text>
            <Text style={[styles.testBadge, { backgroundColor: colors.warningLight, color: colors.warning }]}>
              TEST MODE (Razorpay Sandbox)
            </Text>
          </View>

          <View style={styles.body}>
            <Text style={[styles.orderTitle, { color: colors.text }]}>{order.description}</Text>
            <Text style={[styles.amountText, { color: colors.primary }]}>{formattedAmount}</Text>

            <View style={[styles.infoBox, { backgroundColor: colors.surfaceVariant }]}>
              <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Order ID:</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{order.razorpay_order_id}</Text>
              {order.prefill?.email && (
                <>
                  <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Email:</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>{order.prefill.email}</Text>
                </>
              )}
            </View>

            {processing ? (
              <View style={styles.processingBox}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.processingText, { color: colors.textSecondary }]}>
                  Processing Payment...
                </Text>
              </View>
            ) : (
              <View style={styles.actionButtons}>
                <Button
                  title={`Pay ${formattedAmount} (Success)`}
                  onPress={handleSimulateSuccess}
                  variant="primary"
                  size="large"
                />
                <Button
                  title="Simulate Payment Failure"
                  onPress={handleSimulateFailure}
                  variant="outline"
                  size="medium"
                  style={{ marginTop: 10 }}
                />
              </View>
            )}
          </View>

          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <TouchableOpacity onPress={onCancel} disabled={processing} style={styles.cancelBtn}>
              <Text style={[styles.cancelText, { color: colors.textMuted }]}>Cancel & Return</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  brandText: {
    fontSize: 18,
    fontWeight: '800',
  },
  testBadge: {
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  body: {
    paddingVertical: 20,
  },
  orderTitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 6,
  },
  amountText: {
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 16,
  },
  infoBox: {
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  processingBox: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  processingText: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: '600',
  },
  actionButtons: {
    width: '100%',
  },
  footer: {
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
  },
  cancelBtn: {
    padding: 8,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
