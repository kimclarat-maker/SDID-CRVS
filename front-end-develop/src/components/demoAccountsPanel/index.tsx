import { DemoCredential } from "@/demo/credentials";
import Button from "@/components/button";
import "./styles.css";

type Props = {
  accounts: DemoCredential[];
  onUseAccount: (credential: DemoCredential) => void;
};

export default function DemoAccountsPanel({ accounts, onUseAccount }: Props) {
  return (
    <div className="demo-accounts-panel">
      <div className="demo-accounts-panel-title">Demo accounts</div>
      <p className="demo-accounts-panel-hint">
        This environment uses fictional data and does not connect to
        production services. Pick a role to fill in the form, then sign in.
      </p>
      {accounts.map((account) => (
        <div key={account.email} className="demo-account-row">
          <div>
            <div className="demo-account-role">{account.roleLabel}</div>
            <div className="demo-account-email">{account.email}</div>
            <div className="demo-account-password">{account.password}</div>
          </div>
          <Button
            text="Use this account"
            appearance="ghost"
            size="sm"
            onClick={() => onUseAccount(account)}
            type="button"
          />
        </div>
      ))}
    </div>
  );
}
