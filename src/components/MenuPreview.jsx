const DEFAULT_STYLES = {
  title: { font: 'PingFang SC', size: 14, color: '#2D2D2D' },
  mainCategory: { font: 'PingFang SC', size: 24, color: '#2D2D2D' },
  mainEn: { font: 'PingFang SC', size: 14, color: '#888888' },
  subCategory: { font: 'PingFang SC', size: 16, color: '#D6A573' },
  dishName: { font: 'PingFang SC', size: 14, color: '#2D2D2D' },
  dishDesc: { font: 'PingFang SC', size: 12, color: '#888888' },
}

export default function MenuPreview({ menuData, headerImage, bgColor, footerImage, decoImage, menuTitle, titleHeight, headerOverlap, footerOverlap, styles }) {
  const s = styles || DEFAULT_STYLES

  if (!menuData) {
    return (
      <div className="menu-preview">
        <div className="menu-card" style={{ width: 375, margin: '0 auto', minHeight: 400 }}>
          <div className="empty-state" style={{ paddingTop: 100 }}>
            <span className="icon">📋</span>
            <p>请在左侧输入 JSON 数据</p>
          </div>
        </div>
      </div>
    )
  }

  const { title, menuDetail } = menuData

  // Group by main → sub → dishes
  const mainOrder = []
  const grouped = {}
  if (Array.isArray(menuDetail)) {
    for (const item of menuDetail) {
      const main = item.category?.main || '其他'
      const mainEn = item.category?.mainEn || ''
      const sub = item.category?.sub || '其他'
      if (!grouped[main]) {
        grouped[main] = { _order: [], _data: {}, _mainEn: '' }
        mainOrder.push(main)
      }
      if (!grouped[main]._mainEn && mainEn) {
        grouped[main]._mainEn = mainEn
      }
      if (!grouped[main]._data[sub]) {
        grouped[main]._data[sub] = { dishes: [] }
        grouped[main]._order.push(sub)
      }
      if (Array.isArray(item.dishes)) {
        grouped[main]._data[sub].dishes.push(...item.dishes)
      }
    }
  }

  return (
    <div className="menu-preview">
      <div className="menu-card" style={{ position: 'relative', width: 375, margin: '0 auto', backgroundColor: bgColor || '#FFFFFF' }}>
        {headerImage && <img className="menu-header-img" src={headerImage} alt="header" />}

        {/* Title — positioned from card top */}
        {(menuTitle || title) && (
          <div
            style={{
              position: 'absolute',
              top: titleHeight ?? 136,
              left: 20,
              right: 20,
              textAlign: 'center',
              zIndex: 2,
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                fontFamily: `"${s.title.font}"`,
                fontSize: s.title.size,
                color: s.title.color || '#2D2D2D',
                fontWeight: 400,
                letterSpacing: 1,
                lineHeight: 1.4,
                textShadow: bgColor && bgColor !== '#FFFFFF' ? 'none' : undefined,
              }}
            >
              {menuTitle || title}
            </div>
          </div>
        )}

        <div
          className="menu-body"
        >
          <div className="menu-content" style={{
            paddingLeft: 20,
            paddingRight: 20,
            ...(headerImage ? { marginTop: headerOverlap ?? -36 } : { paddingTop: 20 }),
          }}>

            {/* Main categories */}
            {mainOrder.map((mainName, mainIdx) => {
              const mainGroup = grouped[mainName]
              const subs = mainGroup._order
              const subData = mainGroup._data

              return (
                <div key={mainName}>
                  {/* Main category header — text bottom-aligned with deco image behind */}
                  <div
                    style={{
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'flex-end',
                      justifyContent: 'center',
                      padding: mainIdx > 0 ? '60px 0 0' : '12px 0 0',
                      marginBottom: 32,
                      minHeight: decoImage ? 25.5 : 0,
                    }}
                  >
                    {decoImage && (
                      <div
                        style={{
                          position: 'absolute',
                          bottom: 0,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: 146,
                          height: 25.5,
                          backgroundImage: `url(${decoImage})`,
                          backgroundSize: 'contain',
                          backgroundPosition: 'center',
                          backgroundRepeat: 'no-repeat',
                          zIndex: 0,
                          pointerEvents: 'none',
                        }}
                      />
                    )}
                    <div
                      style={{
                        position: 'relative',
                        zIndex: 1,
                        textAlign: 'center',
                        paddingTop: 2,
                      }}
                    >
                      <div
                        style={{
                          fontFamily: `"${s.mainCategory.font}"`,
                          fontSize: s.mainCategory.size,
                          color: s.mainCategory.color || '#2D2D2D',
                          fontWeight: 600,
                          letterSpacing: 2,
                          lineHeight: 1.3,
                        }}
                      >
                        {mainName}
                      </div>
                      {mainGroup._mainEn && (
                        <div
                          style={{
                            fontFamily: `"${s.mainEn.font}"`,
                            fontSize: s.mainEn.size,
                            color: s.mainEn.color || '#888',
                            fontWeight: 400,
                            lineHeight: 1.3,
                          }}
                        >
                          {mainGroup._mainEn}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Sub categories */}
                  {subs.map((subName, subIdx) => {
                    const { dishes } = subData[subName]
                    if (!dishes || dishes.length === 0) return null

                    return (
                      <div
                        key={subName}
                        style={{
                          marginBottom: subIdx < subs.length - 1 ? 32 : 0,
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                          }}
                        >
                          {/* Left: fixed 100px — sub cat right-aligned */}
                          <div
                            style={{
                              width: 100,
                              flexShrink: 0,
                              textAlign: 'right',
                              paddingRight: 10,
                            }}
                          >
                            <div
                              style={{
                                display: 'inline-block',
                                textAlign: 'right',
                                maxWidth: 77,
                                wordBreak: 'break-word',
                                lineHeight: 1.4,
                                fontFamily: `"${s.subCategory.font}"`,
                                fontSize: s.subCategory.size,
                                fontWeight: 700,
                                color: s.subCategory.color || '#D6A573',
                              }}
                            >
                              {subName}
                            </div>
                          </div>

                          {/* Decorative 2×39 rect */}
                          <div
                            style={{
                              width: 2,
                              height: 39,
                              backgroundColor: '#D6A573',
                              borderRadius: 1,
                              flexShrink: 0,
                              marginTop: 2,
                            }}
                          />

                          {/* Right: dish cards, 10px from rect */}
                          <div
                            style={{
                              paddingLeft: 10,
                              flex: 1,
                              maxWidth: 247,
                            }}
                          >
                            {dishes.map((dish, idx) => (
                              <div
                                key={idx}
                                style={{
                                  marginBottom: idx < dishes.length - 1 ? 12 : 0,
                                }}
                              >
                                <div
                                  style={{
                                    fontFamily: `"${s.dishName.font}"`,
                                    fontSize: s.dishName.size,
                                    fontWeight: 500,
                                    color: s.dishName.color || '#2D2D2D',
                                    textAlign: 'left',
                                    wordBreak: 'break-word',
                                    lineHeight: 1.4,
                                  }}
                                >
                                  {dish.name}
                                </div>
                                {dish.desc && (
                                  <div
                                    style={{
                                      fontFamily: `"${s.dishDesc.font}"`,
                                      fontSize: s.dishDesc.size,
                                      fontWeight: 400,
                                      color: s.dishDesc.color || '#888',
                                      wordBreak: 'break-word',
                                      lineHeight: 1.4,
                                      marginTop: 1,
                                    }}
                                  >
                                    {dish.desc}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })}

            <div style={{ height: 12 }} />
          </div>
        </div>

        {footerImage && <img className="menu-footer-img" src={footerImage} alt="footer" style={{ marginTop: footerOverlap ?? -100 }} />}
      </div>
    </div>
  )
}
