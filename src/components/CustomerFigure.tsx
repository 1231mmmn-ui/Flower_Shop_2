/** お客様と、その言葉。セリフはゆっくり一行ずつ現れる。 */

import './CustomerFigure.css';
import { customer as customerImage, type CustomerMood } from '../assets/paths';
import type { Customer } from '../data/customers';

interface CustomerFigureProps {
  customer: Customer;
  mood: CustomerMood;
  lines: string[];
  /** 名前と年ごろを添えるか */
  showName?: boolean;
}

export function CustomerFigure({
  customer,
  mood,
  lines,
  showName = true,
}: CustomerFigureProps) {
  return (
    <div className="figure">
      <img
        className="figure__person appear"
        src={customerImage(customer.id, mood)}
        alt={customer.name}
      />

      <div className="figure__balloon panel">
        {showName && (
          <p className="figure__who">
            {customer.name}
            <span className="whisper">　{customer.age}</span>
          </p>
        )}
        {lines.map((line, index) => (
          <p
            key={line}
            className="figure__line appear"
            style={{ animationDelay: `${index * 0.42}s` }}
          >
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}
