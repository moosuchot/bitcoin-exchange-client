
let proxyquire = require('proxyquireify')(require);

let Trade = function () {};
Trade.buy = function () {};

let PaymentMedium = function () {};
PaymentMedium.getAll = () => Promise.resolve([]);

let stubs = {
  './trade': Trade,
  './payment-medium': PaymentMedium
};

let Quote = proxyquire('../src/quote-concrete', stubs);

describe('Quote', function () {
  let q;
  let api;
  let delegate;

  beforeEach(function () {
    api = {};
    delegate = {
      save () { return Promise.resolve(); },
      trades: []
    };
    q = new Quote(api, delegate);

    q._id = '1';
    q._baseAmount = 1;
    q._quoteAmount = 1;
    q._baseCurrency = 'EUR';
    q._quoteCurrency = 'BTC';
    q._feeCurrency = 'EUR';
    q._feeAmount = 1;
    q._expiresAt = 1;
    q._currentTime = 0;
  });

  describe('class', function () {
    describe('new Quote()', () =>
      it('should construct a Quote', () =>
expect(q instanceof Quote).toBeTruthy())
    );

    describe('getQuote()', function () {
      it('should convert cents', done =>
        Quote.getQuote(1000, 'EUR', 'BTC', ['EUR', 'BTC']).then(baseAmount =>
          expect(baseAmount).toEqual('10.00')).then(done)
      );

      it('should convert satoshis', done =>
        Quote.getQuote(100000000, 'BTC', 'EUR', ['EUR', 'BTC']).then(baseAmount =>
expect(baseAmount).toEqual('1.00000000')).then(done)
      );

      it('should check if the base currency is supported', function (done) {
        let promise = Quote.getQuote(100000000, 'XXX', 'BTC', ['EUR', 'BTC']);
        expect(promise).toBeRejected(done);
      });

      it('should check if the quote currency is supported', function (done) {
        let promise = Quote.getQuote(100000000, 'EUR', 'DOGE', ['EUR', 'BTC']);
        expect(promise).toBeRejected(done);
      });
    });
  });

  describe('instance', function () {
    describe('getters', () =>
      it('should work', function () {
        expect(q.expiresAt).toBe(1);
        expect(q.currentTime).toBe(0);
        expect(q.baseCurrency).toBe('EUR');
        expect(q.quoteCurrency).toBe('BTC');
        expect(q.baseAmount).toBe(1);
        expect(q.feeCurrency).toBe('EUR');
        expect(q.feeAmount).toBe(1);
        expect(q.quoteAmount).toBe(1);
        expect(q.id).toBe('1');
        expect(q.api).toBe(api);
        expect(q.delegate).toBe(delegate);
        expect(q.paymentMediums).toEqual(null);
      })
    );

    describe('debug', () =>
      it('can be set', function () {
        q.debug = true;
        expect(q.debug).toEqual(true);
      })
    );

    describe('getPaymentMediums()', function () {
      beforeEach(() => spyOn(PaymentMedium, 'getAll').and.callThrough());

      it('should cache the result', function () {
        q._paymentMediums = [];
        q.getPaymentMediums();
        expect(PaymentMedium.getAll).not.toHaveBeenCalled();
      });

      it('should fetch mediums with fiat inCurrency if baseAmount is positive BTC...', function () {
        q._baseAmount = 1;
        q._baseCurrency = 'BTC';
        q._quoteCurrency = 'EUR';
        q.getPaymentMediums();
        expect(PaymentMedium.getAll).toHaveBeenCalled();
        expect(PaymentMedium.getAll.calls.argsFor(0)[0]).toEqual('EUR');
      });

      it('should fetch mediums with BTC inCurrency if baseAmount is negative BTC', function () {
        q._baseAmount = -1;
        q._baseCurrency = 'BTC';
        q._quoteCurrency = 'EUR';
        q.getPaymentMediums();
        expect(PaymentMedium.getAll).toHaveBeenCalled();
        expect(PaymentMedium.getAll.calls.argsFor(0)[0]).toEqual('BTC');
      });
    });
  });
});
