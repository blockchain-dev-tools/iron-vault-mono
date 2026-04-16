import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { R } from '@iron-vault/theme';
import type { ColorTokens } from '@iron-vault/theme';
import { useTheme, useLocale } from '../../store/AppContext';
import Button from '../../components/ui/Button';
import Icon from '../../components/ui/Icon';
import { Fonts } from '../../lib/fonts';
import { computeNextDefaultPath } from './pathUtils';

const PATH_RE = /^m(\/\d+'?)+$/;

export default function AddAccountSheet({ chain, accounts, onClose, onAdd }: {
  chain: 'eth' | 'sol';
  accounts: { eth: { short: string; full: string; path: string; custom: boolean }[]; sol: { short: string; full: string; path: string; custom: boolean }[] };
  onClose: () => void;
  onAdd: (chain: 'eth' | 'sol', path: string, custom: boolean) => Promise<void>;
}) {
  const C = useTheme();
  const t = useLocale();
  const s = useMemo(() => makeStyles(C), [C]);

  const accts = chain === 'eth' ? accounts.eth : accounts.sol;
  const computedDefault = computeNextDefaultPath(chain, accts);
  const nextNum = accts.length + 1;

  const [inputPath, setInputPath] = useState(computedDefault);
  const [showCustom, setShowCustom] = useState(false);
  const [adding, setAdding] = useState(false);

  const pathValid = PATH_RE.test(inputPath);
  const canConfirm = !showCustom || pathValid;
  const effectivePath = showCustom ? inputPath : computedDefault;
  const isCustom = showCustom && inputPath !== computedDefault;

  const handleAdd = async () => {
    setAdding(true);
    try {
      await onAdd(chain, effectivePath, isCustom);
      onClose();
    } finally {
      setAdding(false);
    }
  };

  const toggleCustom = () => {
    setShowCustom(v => !v);
    setInputPath(computedDefault);
  };

  const chainLabel = chain === 'eth' ? t.vault.ethLabel : t.vault.solLabel;

  return (
    <View style={s.panel}>
      <Text style={s.title}>{chainLabel} {t.vault.addAccount}</Text>

      {showCustom ? (
        <View>
          <Text style={s.inputLabel}>{t.vault.addAccountPath}</Text>
          <TextInput
            style={[s.pathInput, !pathValid && inputPath.length > 0 && s.pathInputError]}
            value={inputPath}
            onChangeText={setInputPath}
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            placeholder={computedDefault}
            placeholderTextColor={C.textDisabled}
          />
          {!pathValid && inputPath.length > 0 && (
            <Text style={s.pathError}>{t.vault.addAccountInvalidPath}</Text>
          )}
          {inputPath !== computedDefault && (
            <TouchableOpacity onPress={() => setInputPath(computedDefault)} style={s.useDefaultRow}>
              <Text style={s.useDefaultText}>{t.vault.addAccountUseDefault}</Text>
              <Text style={s.useDefaultPath} numberOfLines={1}>{computedDefault}</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={s.infoCard}>
          <Text style={s.infoAcct}>{t.vault.account(nextNum)}</Text>
          <Text style={s.infoPath}>{computedDefault}</Text>
        </View>
      )}

      <TouchableOpacity onPress={toggleCustom} style={s.customToggle}>
        <Icon name={showCustom ? 'expand-less' : 'expand-more'} size={14} color={C.text2} />
        <Text style={s.customToggleText}>
          {showCustom ? t.vault.advancedHide : t.vault.addAccountCustomPath}
        </Text>
      </TouchableOpacity>
      <View style={{ height: 12 }} />
      <Button variant="primary" onPress={handleAdd} disabled={!canConfirm} loading={adding}>
        {t.vault.addAccountConfirm}
      </Button>
    </View>
  );
}

const makeStyles = (C: ColorTokens) => StyleSheet.create({
  panel: { padding: 24, paddingTop: 12 },
  title: { color: C.text, fontSize: 18, fontFamily: Fonts.spaceGrotesk.bold, marginBottom: 20 },
  infoCard: {
    backgroundColor: C.surfaceContainer,
    padding: 16, borderLeftWidth: 3, borderLeftColor: C.primary,
  },
  infoAcct: { color: C.text, fontSize: 15, fontFamily: Fonts.spaceGrotesk.bold, marginBottom: 6 },
  infoPath: { color: C.text2, fontSize: 12, fontFamily: 'monospace' },
  inputLabel: { color: C.text2, fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 },
  pathInput: {
    backgroundColor: C.surfaceContainer, borderRadius: R.lg,
    borderWidth: 1.5, borderColor: C.borderVariant,
    paddingHorizontal: 14, paddingVertical: 12,
    color: C.text, fontSize: 14, fontFamily: 'monospace',
  },
  pathInputError: { borderColor: C.error },
  pathError: { color: C.error, fontSize: 12, marginTop: 6 },
  useDefaultRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  useDefaultText: { color: C.primary, fontSize: 12, fontFamily: Fonts.spaceGrotesk.bold },
  useDefaultPath: { color: C.text2, fontSize: 11, fontFamily: 'monospace', flex: 1 },
  customToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 10 },
  customToggleText: { color: C.text2, fontSize: 12 },
});
